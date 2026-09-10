<template>
  <div class="container">
    <h1>📊 Visualizer Stats</h1>
    <div id="pixi-container"></div>
  </div>
</template>

<script setup>
onMounted(() => {
  console.log('Frontend loaded and ready for PixiJS')
})
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #1e1e2e 0%, #2d2d3d 100%);
  color: white;
  padding: 2rem;
}

h1 {
  margin: 0;
  font-size: 2.5rem;
  background: linear-gradient(90deg, #00ff88 0%, #00ccff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

#pixi-container {
  width: 90%;
  max-width: 1200px;
  height: 600px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(0, 255, 136, 0.3);
  border-radius: 12px;
  margin-top: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
</style>
