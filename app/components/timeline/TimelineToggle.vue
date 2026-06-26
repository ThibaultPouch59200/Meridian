<template>
  <div class="flex items-center gap-1">
    <button
      :class="[
        'px-[10px] py-[5px] text-[11px] font-medium tracking-[0.5px] border rounded-[4px] transition-all font-sans cursor-pointer',
        store.timelineMode === 'day'
          ? 'bg-black text-white border-black dark:bg-[#f0f0ee] dark:text-[#0d0d0d] dark:border-[#f0f0ee]'
          : 'bg-transparent text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-black dark:text-gray-400 dark:border-[#2e2e2e] dark:hover:bg-[#252525] dark:hover:text-[#f0f0ee]',
      ]"
      @click="store.setTimelineMode('day')"
    >Jour</button>
    <button
      :class="[
        'px-[10px] py-[5px] text-[11px] font-medium tracking-[0.5px] border rounded-[4px] transition-all font-sans cursor-pointer',
        store.timelineMode === 'month'
          ? 'bg-black text-white border-black dark:bg-[#f0f0ee] dark:text-[#0d0d0d] dark:border-[#f0f0ee]'
          : 'bg-transparent text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-black dark:text-gray-400 dark:border-[#2e2e2e] dark:hover:bg-[#252525] dark:hover:text-[#f0f0ee]',
      ]"
      @click="store.setTimelineMode('month')"
    >Mois</button>
  </div>
</template>

<script setup lang="ts">
const store = useEventsStore()
</script>
