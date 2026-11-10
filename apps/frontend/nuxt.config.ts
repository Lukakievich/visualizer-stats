export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
   modules: ['@pinia/nuxt'],
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE || 'http://localhost:3001',
      wsUrl: process.env.WS_URL || 'ws://localhost:3001/ws',
    }
  }
})