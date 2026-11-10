<script setup lang="ts">
import { Application, Graphics, Text } from 'pixi.js'
import gsap from 'gsap'
import { useMetricsStore } from '~/stores/metrics'

const props = defineProps<{ metricId: number }>()
const store = useMetricsStore()
const container = ref<HTMLDivElement>()

const PAD = { top: 20, right: 30, bottom: 30, left: 55 }
const COLOR = 0x42b883
const MIN_WINDOW = 5
const MAX_WINDOW = 500
const windowSize = ref(30)
const offset = ref(0)
let lastId = 0

interface P {
  id: number
  t: number
  v: number
}

let app: Application | null = null
let grid!: Graphics
let line!: Graphics
let yLabels: Text[] = []
let xLabels: Text[] = []
let destroyed = false
let data: P[] = []

let dragging = false
let dragStartX = 0
let dragStartOffset = 0

let hoverG!: Graphics
let hoverX: number | null = null
let shown: P[] = []

const view = { xMin: 0, xMax: 1, yMin: 0, yMax: 1 }
const tip = { id: 0, t: 0, v: 0 }

const tooltip = ref<{
  x: number
  y: number
  time: string
  value: string
  flip: boolean
} | null>(null)

function getAll(): P[] {
  return (store.pointsByMetric[props.metricId] ?? []).map((p) => ({
    id: p.id,
    t: new Date(p.timestamp).getTime(),
    v: Number(p.value),
  }))
}

function calcTarget(pts: P[]) {
  let xMin = pts[0]!.t
  let xMax = pts[pts.length - 1]!.t
  if (xMin === xMax) {
    xMin -= 5000
    xMax += 5000
  }
  const values = pts.map((p) => p.v)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = (max - min) * 0.1 || 1
  return { xMin, xMax, yMin: min - pad, yMax: max + pad }
}

function sliceWindow(all: P[]): P[] {
  const maxOffset = Math.max(0, all.length - windowSize.value)
  offset.value = Math.min(offset.value, maxOffset)
  const end = all.length - offset.value
  return all.slice(Math.max(0, end - windowSize.value), end)
}

function showNow(all: P[]) {
  const pts = sliceWindow(all)
  if (!pts.length) return
  data = pts
  gsap.killTweensOf([view, tip])
  Object.assign(view, calcTarget(pts))
  Object.assign(tip, pts[pts.length - 1])
  draw()
}

function getScale() {
  const w = app!.screen.width
  const h = app!.screen.height
  const plotW = w - PAD.left - PAD.right
  const plotH = h - PAD.top - PAD.bottom
  const sx = (t: number) =>
    PAD.left + ((t - view.xMin) / (view.xMax - view.xMin)) * plotW
  const sy = (v: number) =>
    PAD.top + (1 - (v - view.yMin) / (view.yMax - view.yMin)) * plotH
  return { w, h, sx, sy }
}

function draw() {
  if (!app || !data.length) return
  const { w, h, sx, sy } = getScale()

  const plotW = w - PAD.left - PAD.right
  const plotH = h - PAD.top - PAD.bottom

  grid.clear()
  line.clear()

  yLabels.forEach((label, i) => {
    const v = view.yMin + ((view.yMax - view.yMin) * i) / (yLabels.length - 1)
    const y = sy(v)
    grid.moveTo(PAD.left, y).lineTo(w - PAD.right, y)
    label.text = v.toFixed(1)
    label.position.set(PAD.left - 8, y)
  })

  xLabels.forEach((label, i) => {
    const t = view.xMin + ((view.xMax - view.xMin) * i) / (xLabels.length - 1)
    label.text = new Date(t).toLocaleTimeString('ru-RU')
    label.position.set(sx(t), h - PAD.bottom + 8)
  })
  grid.stroke({ width: 1, color: 0x888888, alpha: 0.25 })

  const pts: P[] = [
    ...data.slice(0, -1),
    { ...data[data.length - 1]!, t: tip.t, v: tip.v },
  ]
  shown = pts

  pts.forEach((p, i) => {
    if (i === 0) line.moveTo(sx(p.t), sy(p.v))
    else line.lineTo(sx(p.t), sy(p.v))
  })
  line.stroke({ width: 2, color: COLOR, join: 'round', cap: 'round' })

  pts.forEach((p) => line.circle(sx(p.t), sy(p.v), 3))
  line.fill(COLOR)
  drawHover()
}

function drawHover() {
  if (!app) return
  hoverG.clear()

  const { w, h, sx, sy } = getScale()
  const inside =
    hoverX !== null && hoverX >= PAD.left && hoverX <= w - PAD.right
  if (!inside || !shown.length) {
    tooltip.value = null
    return
  }

  let best = shown[0]!
  let bestDist = Infinity
  for (const p of shown) {
    const d = Math.abs(sx(p.t) - hoverX!)
    if (d < bestDist) {
      bestDist = d
      best = p
    }
  }

  const x = sx(best.t)
  const y = sy(best.v)

  hoverG.moveTo(x, PAD.top).lineTo(x, h - PAD.bottom)
  hoverG.stroke({ width: 1, color: 0xffffff, alpha: 0.4 })
  hoverG.circle(x, y, 6).fill(COLOR).stroke({ width: 2, color: 0xffffff })

  tooltip.value = {
    x,
    y,
    time: new Date(best.t).toLocaleTimeString('ru-RU'),
    value: best.v.toFixed(2),
    flip: x > w - 140,
  }
}

function update() {
  const all = getAll()
  if (!all.length) return

  if (offset.value > 0) {
    offset.value += all.filter((p) => p.id > lastId).length
  }
  lastId = all[all.length - 1]!.id

  const pts = sliceWindow(all)
  const prevLast = data[data.length - 1]
  data = pts
  const last = pts[pts.length - 1]!
  const target = calcTarget(pts)

  if (!prevLast || offset.value > 0) {
    Object.assign(view, target)
    Object.assign(tip, last)
    draw()
    return
  }

  gsap.killTweensOf([view, tip])
  tip.t = prevLast.t
  tip.v = prevLast.v
  gsap.to(view, { ...target, duration: 0.5, ease: 'power2.out' })
  gsap.to(tip, {
    t: last.t,
    v: last.v,
    duration: 0.5,
    ease: 'power2.out',
    onUpdate: draw,
  })
}

function setWindow(n: number) {
  const size = Math.min(MAX_WINDOW, Math.max(MIN_WINDOW, n))
  if (size === windowSize.value) return
  windowSize.value = size

  const pts = sliceWindow(getAll())
  if (!pts.length) return
  data = pts

  gsap.killTweensOf(view)
  gsap.to(view, {
    ...calcTarget(pts),
    duration: 0.3,
    ease: 'power2.out',
    onUpdate: draw,
  })
}

function onWheel(e: WheelEvent) {
  e.preventDefault()
  setWindow(
    e.deltaY > 0
      ? Math.ceil(windowSize.value * 1.25)
      : Math.floor(windowSize.value * 0.8),
  )
}

function onPointerDown(e: PointerEvent) {
  if (!app) return
  dragging = true
  dragStartX = e.clientX
  dragStartOffset = offset.value
  app.canvas.setPointerCapture(e.pointerId)
  app.canvas.style.cursor = 'grabbing'
}

function onPointerMove(e: PointerEvent) {
  if (!app) return
  hoverX = e.offsetX

  if (!dragging) {
    drawHover()
    return
  }

  const all = getAll()
  const plotW = app.screen.width - PAD.left - PAD.right
  const pxPerPoint = plotW / Math.max(1, windowSize.value - 1)
  const shift = Math.round((e.clientX - dragStartX) / pxPerPoint)
  const maxOffset = Math.max(0, all.length - windowSize.value)
  const next = Math.min(maxOffset, Math.max(0, dragStartOffset + shift))

  if (next === offset.value) {
    drawHover()
    return
  }
  offset.value = next
  showNow(all)
}

function onPointerLeave() {
  hoverX = null
  drawHover()
}

function onPointerUp() {
  dragging = false
  if (app) app.canvas.style.cursor = 'grab'
}

function resetZoom() {
  windowSize.value = 30
  offset.value = 0
  showNow(getAll())
}

function goLive() {
  offset.value = 0
  showNow(getAll())
}

onMounted(async () => {
  const a = new Application()
  await a.init({
    resizeTo: container.value!,
    backgroundAlpha: 0,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  })

  if (destroyed) {
    a.destroy(true, { children: true })
    return
  }

  app = a
  container.value!.appendChild(a.canvas)
  a.canvas.addEventListener('wheel', onWheel, { passive: false })
  a.canvas.addEventListener('dblclick', resetZoom)
  a.canvas.style.cursor = 'grab'
  a.canvas.style.touchAction = 'none'
  a.canvas.addEventListener('pointerdown', onPointerDown)
  a.canvas.addEventListener('pointerup', onPointerUp)
  a.canvas.addEventListener('pointermove', onPointerMove)
  a.canvas.addEventListener('pointerleave', onPointerLeave)
  a.canvas.addEventListener('pointercancel', onPointerUp)

  grid = new Graphics()
  line = new Graphics()
  hoverG = new Graphics()
  a.stage.addChild(grid, line, hoverG)

  const style = { fill: 0x8a8a9a, fontSize: 11 }
  yLabels = Array.from({ length: 5 }, () => {
    const t = new Text({ text: '', style })
    t.anchor.set(1, 0.5)
    a.stage.addChild(t)
    return t
  })
  xLabels = Array.from({ length: 4 }, () => {
    const t = new Text({ text: '', style })
    t.anchor.set(0.5, 0)
    a.stage.addChild(t)
    return t
  })

  a.renderer.on('resize', draw)
  update()
})

watch(() => store.pointsByMetric[props.metricId], update)

onBeforeUnmount(() => {
  destroyed = true
  gsap.killTweensOf([view, tip])
  app?.destroy(true, { children: true })
  app = null
})
</script>

<template>
  <div>
    <div class="wrap">
      <div ref="container" class="chart" />
      <div
        v-if="tooltip"
        class="tooltip"
        :class="{ flip: tooltip.flip }"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      >
        <b>{{ tooltip.value }}</b>
        <span>{{ tooltip.time }}</span>
      </div>
    </div>
    <p class="hint">
      Dots: <b>{{ windowSize }}</b> · scroll wheel — zoom, double click — reset
    </p>
    <button v-if="offset > 0" class="live" @click="goLive">
      To newest dots
    </button>
  </div>
</template>

<style scoped>
.chart {
  width: 100%;
  height: 360px;
  background: #1e1e2e;
  border-radius: 8px;
  overflow: hidden;
}
.hint {
  margin: 8px 0 0;
  font-size: 13px;
  color: #888;
}
.live {
  margin-left: 8px;
  cursor: pointer;
}
.wrap {
  position: relative;
}
.tooltip {
  position: absolute;
  pointer-events: none;
  transform: translate(14px, -50%);
  display: flex;
  flex-direction: column;
  padding: 6px 10px;
  background: #2b2b40;
  color: #fff;
  border-radius: 6px;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  white-space: nowrap;
}
.tooltip.flip {
  transform: translate(calc(-100% - 14px), -50%);
}
.tooltip span {
  color: #9a9ab0;
}
</style>
