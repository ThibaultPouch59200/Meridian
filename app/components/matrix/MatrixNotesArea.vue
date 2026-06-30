<template>
  <div class="flex flex-col overflow-hidden h-full">
    <div class="section-label text-[11px] mb-[6px] flex-shrink-0">Notes + Ideas</div>
    <textarea
      :value="store.notes"
      class="w-full flex-1 resize-none border-none outline-none font-sans text-[13px] text-black dark:text-[#f0f0ee] leading-[1.8] bg-transparent placeholder:text-gray-400 dark:placeholder:text-[#555555]"
      placeholder="Idées, réflexions, références..."
      @input="store.setNotes(($event.target as HTMLTextAreaElement).value)"
    />
  </div>
</template>

<script setup lang="ts">
const store = useMatrixStore()
</script>
