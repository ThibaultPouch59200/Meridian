<template>
  <div class="flex flex-col overflow-hidden h-full">
    <div class="section-label mb-[6px] flex-shrink-0">Notes + Ideas</div>
    <textarea
      :value="store.notes"
      class="w-full flex-1 resize-none border-none outline-none font-sans text-[11px] text-black leading-[1.8] bg-transparent"
      placeholder="Idées, réflexions, références..."
      @input="store.setNotes(($event.target as HTMLTextAreaElement).value)"
    />
  </div>
</template>

<script setup lang="ts">
const store = useMatrixStore()
</script>
