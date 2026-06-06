<template>
  <nav class="w-[52px] h-screen flex flex-col items-center justify-center gap-[6px] flex-shrink-0 relative z-10">
    <div
      class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-[140px] bg-gray-200 pointer-events-none"
    />
    <IconButton title="Timeline" :active="route.path.startsWith('/timeline')" @click="navigateTo('/timeline')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-[18px] h-[18px]" style="stroke-width:1.4">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    </IconButton>
    <IconButton title="Matrice" :active="route.path.startsWith('/matrix')" @click="navigateTo('/matrix')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-[18px] h-[18px]" style="stroke-width:1.4">
        <rect x="3" y="3" width="8" height="8" rx="1"/>
        <rect x="13" y="3" width="8" height="8" rx="1"/>
        <rect x="3" y="13" width="8" height="8" rx="1"/>
        <rect x="13" y="13" width="8" height="8" rx="1"/>
      </svg>
    </IconButton>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()
</script>
