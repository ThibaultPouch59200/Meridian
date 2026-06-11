<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <header class="flex items-center justify-between px-4 sm:px-7 py-[14px] sm:pl-6 border-b border-gray-200 flex-shrink-0">
      <span class="font-display text-[20px] font-normal tracking-[-0.3px]">Priority Matrix</span>
      <span class="text-xs text-gray-400">{{ dateLabel }}</span>
    </header>

    <!-- Desktop layout -->
    <template v-if="!isMobile">
      <div class="flex-1 flex overflow-hidden min-h-0">
        <div class="w-5 flex items-center justify-center flex-shrink-0">
          <span class="-rotate-90 text-[8px] tracking-[2px] uppercase text-gray-400 font-semibold whitespace-nowrap pointer-events-none select-none">IMPORTANCE</span>
        </div>

        <div
          class="flex-1 grid overflow-hidden px-6 min-h-0"
          style="grid-template-columns: 1fr 1fr 190px; grid-template-rows: 1fr 1fr;"
        >
          <MatrixQuadrant
            title="Important, Not Urgent"
            subtitle="Décider quand faire"
            quadrant-id="inu"
            container-class="border border-gray-200 p-3 border-r-0 border-b-0"
          />
          <MatrixQuadrant
            title="Important &amp; Urgent"
            subtitle="Faire immédiatement"
            quadrant-id="iu"
            container-class="border border-gray-200 p-3 border-b-0"
          />
          <MatrixQuadrant
            title="Tasks for Today"
            quadrant-id="today"
            container-class="border border-gray-200 p-3 border-l-0 row-span-2"
          />
          <MatrixQuadrant
            title="Not Important &amp; Not Urgent"
            subtitle="Faire plus tard"
            quadrant-id="ninu"
            container-class="border border-gray-200 p-3 border-r-0"
          />
          <MatrixQuadrant
            title="Not Important &amp; Urgent"
            subtitle="Déléguer"
            quadrant-id="niu"
            container-class="border border-gray-200 p-3"
          />
        </div>
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
        <MatrixQuadrant
          title="Tasks for Tomorrow"
          quadrant-id="tomorrow"
          container-class="py-[10px] px-[14px]"
        />
      </div>
    </template>

    <!-- Mobile layout : quadrants empilés -->
    <template v-else>
      <div class="flex-1 overflow-y-auto">
        <MatrixQuadrant
          title="Important &amp; Urgent"
          subtitle="Faire immédiatement"
          quadrant-id="iu"
          container-class="p-4 border-b border-gray-200 min-h-[120px]"
        />
        <MatrixQuadrant
          title="Important, Not Urgent"
          subtitle="Décider quand faire"
          quadrant-id="inu"
          container-class="p-4 border-b border-gray-200 min-h-[120px]"
        />
        <MatrixQuadrant
          title="Not Important &amp; Urgent"
          subtitle="Déléguer"
          quadrant-id="niu"
          container-class="p-4 border-b border-gray-200 min-h-[120px]"
        />
        <MatrixQuadrant
          title="Not Important &amp; Not Urgent"
          subtitle="Faire plus tard"
          quadrant-id="ninu"
          container-class="p-4 border-b border-gray-200 min-h-[120px]"
        />
        <MatrixQuadrant
          title="Tasks for Today"
          quadrant-id="today"
          container-class="p-4 border-b border-gray-200 min-h-[120px]"
        />
        <MatrixQuadrant
          title="Tasks for Tomorrow"
          quadrant-id="tomorrow"
          container-class="p-4 border-b border-gray-200 min-h-[120px]"
        />
        <div class="p-4 min-h-[100px] flex flex-col">
          <MatrixNotesArea />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const { isMobile } = useBreakpoint()

const dateLabel = computed(() => {
  const label = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  return label.charAt(0).toUpperCase() + label.slice(1)
})
</script>
