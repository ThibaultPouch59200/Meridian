export function useCurrentTime() {
  const now = ref(new Date())
  const interval = setInterval(() => { now.value = new Date() }, 60_000)
  onUnmounted(() => clearInterval(interval))
  return { now }
}
