<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <header class="flex items-center justify-between px-7 py-[14px] pl-6 border-b border-gray-200 flex-shrink-0">
      <span class="font-display text-[20px] font-normal tracking-[-0.3px]">Priority Matrix</span>
      <span class="text-xs text-gray-400">{{ dateLabel }}</span>
    </header>

    <div
      class="flex-1 grid overflow-hidden px-6 relative min-h-0"
      style="grid-template-columns: 1fr 1fr 190px; grid-template-rows: 1fr 1fr;"
    >
      <div
        class="absolute left-[2px] top-1/2 -translate-y-1/2 -rotate-90 text-[8px] tracking-[2px] uppercase text-gray-400 font-semibold whitespace-nowrap pointer-events-none select-none"
      >
        IMPORTANCE
      </div>

      <MatrixQuadrant title="Important, Not Urgent" subtitle="Décider quand faire" border-class="border-r-0 border-b-0" />
      <MatrixQuadrant title="Important & Urgent" subtitle="Faire immédiatement" border-class="border-b-0" />

      <div class="border border-gray-200 border-l-0 p-3 row-span-2 flex flex-col overflow-hidden">
        <div class="mb-2 pb-[7px] border-b border-gray-200 flex-shrink-0">
          <div class="text-[9px] font-semibold tracking-[1px] uppercase text-black">Tasks for Today</div>
        </div>
        <div class="flex-1 flex items-center justify-center text-[11px] text-gray-400 italic">
          À implémenter
        </div>
      </div>

      <MatrixQuadrant title="Not Important & Not Urgent" subtitle="Faire plus tard" border-class="border-r-0" />
      <MatrixQuadrant title="Not Important & Urgent" subtitle="Déléguer" />
    </div>

    <div class="flex items-center justify-center gap-2 text-[8px] tracking-[2px] uppercase text-gray-300 font-semibold py-1 border-t border-gray-200 flex-shrink-0">
      <span class="text-sm leading-none">−</span>
      URGENCY
      <span class="text-sm leading-none">+</span>
    </div>

    <div
      class="grid border-t border-gray-200 flex-shrink-0 h-[120px] px-6"
      style="grid-template-columns: 1fr 190px;"
    >
      <div class="border-r border-gray-200 py-[10px] px-[14px] flex flex-col overflow-hidden">
        <MatrixNotesArea />
      </div>
      <div class="py-[10px] px-[14px] flex flex-col overflow-hidden">
        <div class="mb-2 pb-[7px] border-b border-gray-200 flex-shrink-0">
          <div class="text-[9px] font-semibold tracking-[1px] uppercase text-black">Tasks for Tomorrow</div>
        </div>
        <div class="flex-1 flex items-center justify-center text-[11px] text-gray-400 italic">
          À implémenter
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const dateLabel = computed(() => {
  const label = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  return label.charAt(0).toUpperCase() + label.slice(1)
})
</script>
