<script setup lang="ts">
const metricId = 1
const config = useRuntimeConfig()
const { status } = useMetricSocket(metricId)

async function sendRandomPoint() {
  await $fetch(`${config.public.apiBase}/api/data-points`, {
    method: 'POST',
    body: {
      dataPoints: [{ metric_id: metricId, value: Math.round(Math.random() * 100) }],
    },
  })
}
</script>

<template>
  <div style="padding: 24px; font-family: sans-serif; max-width: 900px">
    <h2>Metric {{ metricId }}</h2>
    <p>Status: <b>{{ status }}</b></p>
    <button style="margin-bottom: 12px" @click="sendRandomPoint">
      Create random dot
    </button>
    <LineChart :metric-id="metricId" />
  </div>
</template>