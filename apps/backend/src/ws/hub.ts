import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'http'

interface Client extends WebSocket {
  isAlive: boolean
  subs: Set<number>
}

// metricId -> подписчики
const channels = new Map<number, Set<Client>>()

function send(ws: WebSocket, payload: unknown) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload))
}

function subscribe(ws: Client, metricId: number) {
  if (!channels.has(metricId)) channels.set(metricId, new Set())
  channels.get(metricId)!.add(ws)
  ws.subs.add(metricId)
  send(ws, { type: 'subscribed', metricId })
}

function unsubscribe(ws: Client, metricId: number) {
  const set = channels.get(metricId)
  set?.delete(ws)
  if (set && set.size === 0) channels.delete(metricId)
  ws.subs.delete(metricId)
  send(ws, { type: 'unsubscribed', metricId })
}

function cleanup(ws: Client) {
  for (const id of ws.subs) {
    const set = channels.get(id)
    set?.delete(ws)
    if (set && set.size === 0) channels.delete(id)
  }
  ws.subs.clear()
}

export function initWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', (socket) => {
    const ws = socket as Client
    ws.isAlive = true
    ws.subs = new Set()

    ws.on('pong', () => {
      ws.isAlive = true
    })

    ws.on('message', (raw) => {
      let msg: { type?: string; metricId?: unknown }
      try {
        msg = JSON.parse(raw.toString())
      } catch {
        return send(ws, { type: 'error', message: 'Invalid JSON' })
      }

      const metricId = Number(msg.metricId)
      if (!Number.isInteger(metricId) || metricId <= 0) {
        return send(ws, { type: 'error', message: 'Invalid metricId' })
      }

      if (msg.type === 'subscribe') subscribe(ws, metricId)
      else if (msg.type === 'unsubscribe') unsubscribe(ws, metricId)
      else send(ws, { type: 'error', message: 'Unknown message type' })
    })

    ws.on('close', () => cleanup(ws))
    ws.on('error', () => cleanup(ws))
  })

  // Heartbeat: убираем "мёртвые" соединения
  const interval = setInterval(() => {
    wss.clients.forEach((socket) => {
      const ws = socket as Client
      if (!ws.isAlive) return ws.terminate()
      ws.isAlive = false
      ws.ping()
    })
  }, 30_000)

  wss.on('close', () => clearInterval(interval))

  return wss
}

export function broadcastDataPoints(metricId: number, points: unknown[]) {
  const subscribers = channels.get(metricId)
  if (!subscribers?.size) return
  const payload = { type: 'data_points', metricId, points }
  for (const ws of subscribers) send(ws, payload)
}
