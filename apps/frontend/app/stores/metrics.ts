import { defineStore } from 'pinia'

export interface DataPoint {
  id: number
  metric_id: number
  value: number
  timestamp: string
  [key: string]: unknown
}

const MAX_POINTS = 500

export const useMetricsStore = defineStore('metrics', () => {
  const config = useRuntimeConfig()
  const pointsByMetric = ref<Record<number, DataPoint[]>>({})

  function addPoints(metricId: number, points: DataPoint[]) {
    const map = new Map<number, DataPoint>()
    for (const p of pointsByMetric.value[metricId] ?? []) map.set(p.id, p)
    for (const p of points) map.set(p.id, p)

    pointsByMetric.value[metricId] = [...map.values()]
      .sort((a, b) => a.id - b.id)
      .slice(-MAX_POINTS)
  }

  async function loadHistory(metricId: number, limit = 100) {
    const data = await $fetch<DataPoint[]>(
      `${config.public.apiBase}/api/data-points`,
      {
        query: { metricId, limit },
      },
    )
    addPoints(metricId, data)
  }

  return { pointsByMetric, addPoints, loadHistory }
})
