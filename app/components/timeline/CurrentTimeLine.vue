<template>
  <div
    v-if="isToday"
    class="absolute left-16 right-0 pointer-events-none z-[5]"
    :style="{ top: `${topPx}px` }"
  >
    <div class="w-full h-[1.5px] bg-[#e05555]" />
    <div class="absolute -left-1 -top-[3px] w-2 h-2 rounded-full bg-[#e05555]" />
  </div>
</template>

<script setup lang="ts">
const HOUR_ROW_PX = 56

const props = defineProps<{ currentDate: string }>()
const { now } = useCurrentTime()

const isToday = computed(() => {
  const d = now.value
  const todayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return props.currentDate === todayKey
})

const topPx = computed(() => {
  const mins = now.value.getHours() * 60 + now.value.getMinutes()
  return mins * (HOUR_ROW_PX / 60)
})
</script>
