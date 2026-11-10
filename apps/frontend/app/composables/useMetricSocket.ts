import { useMetricsStore, type DataPoint } from '~/stores/metrics'

export function useMetricSocket(metricId: number) {
  const config = useRuntimeConfig()
  const store = useMetricsStore()

  const status = ref<'connecting' | 'open' | 'closed'>('closed')

  let ws: WebSocket | null = null
  let retries = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  let stopped = false

  function connect() {
    status.value = 'connecting'
    ws = new WebSocket(config.public.wsUrl)

    ws.onopen = () => {
      retries = 0
      status.value = 'open'
      ws!.send(JSON.stringify({ type: 'subscribe', metricId }))
      store.loadHistory(metricId).catch(console.error)
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'data_points' && msg.metricId === metricId) {
        store.addPoints(metricId, msg.points as DataPoint[])
      }
    }

    ws.onclose = () => {
      status.value = 'closed'
      if (!stopped) scheduleReconnect()
    }
  }

  function scheduleReconnect() {
    const delay = Math.min(1000 * 2 ** retries, 15000)
    retries++
    timer = setTimeout(connect, delay)
  }

  function stop() {
    stopped = true
    if (timer) clearTimeout(timer)
    ws?.close()
  }

  onMounted(connect)
  onBeforeUnmount(stop)

  return { status }
}
