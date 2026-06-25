export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  runtimeConfig: {
    databaseUrl: '',
    googleClientId: '',
    googleClientSecret: '',
    googleRedirectUri: '',
    public: {
      appPassword: '',
    },
  },
  devtools: { enabled: true },
  ssr: false,
  components: [{ path: '~/components', pathPrefix: false }],
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],
  nitro: {
    externals: {
      external: ['better-sqlite3'],
    },
  },
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: '~/tailwind.config.ts',
  },
  app: {
    head: {
      title: 'Meridian',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#0d0d0d' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Instrument+Sans:wght@300;400;500;600&display=swap',
        },
      ],
    },
  },
})
