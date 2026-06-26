import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './app/components/**/*.{js,vue,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/app.vue',
  ],
  theme: {
    extend: {
      colors: {
        black: '#0d0d0d',
        'gray-900': '#1a1a1a',
        'gray-600': '#666666',
        'gray-400': '#aaaaaa',
        'gray-200': '#dddddd',
        'gray-100': '#f0f0ee',
        'gray-50':  '#f8f8f6',
      },
      fontFamily: {
        sans:    ['Instrument Sans', 'sans-serif'],
        display: ['Instrument Serif', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
