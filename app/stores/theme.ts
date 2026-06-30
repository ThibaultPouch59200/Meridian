import { defineStore } from 'pinia'

type Theme = 'light' | 'system' | 'dark'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>('system')

  function applyTheme(value: Theme) {
    const isDark =
      value === 'dark' ||
      (value === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', isDark)
  }

  function setTheme(value: Theme) {
    theme.value = value
    localStorage.setItem('meridian-theme', value)
    applyTheme(value)
  }

  function init() {
    const saved = localStorage.getItem('meridian-theme') as Theme | null
    theme.value = saved ?? 'system'
    applyTheme(theme.value)

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (theme.value === 'system') applyTheme('system')
    })
  }

  return { theme, setTheme, init }
})
