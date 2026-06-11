<template>
  <!-- Desktop: sidebar verticale gauche -->
  <nav class="hidden sm:flex w-[52px] h-screen flex-col items-center justify-center gap-[6px] flex-shrink-0 relative z-10">
    <div
      class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-[140px] bg-gray-200 pointer-events-none"
    />
    <IconButton title="Timeline" :active="route.path.startsWith('/timeline')" @click="navigateTo('/timeline')">
      <IconTimeline />
    </IconButton>
    <IconButton title="Matrice" :active="route.path.startsWith('/matrix')" @click="navigateTo('/matrix')">
      <IconMatrix />
    </IconButton>
  </nav>

  <!-- Mobile: barre fixe en bas -->
  <nav class="sm:hidden fixed bottom-0 left-0 right-0 h-14 flex items-center justify-around bg-white border-t border-gray-200 z-50">
    <button
      :class="[
        'flex flex-col items-center gap-1 p-2 transition-colors',
        route.path.startsWith('/timeline') ? 'text-black' : 'text-gray-400',
      ]"
      @click="navigateTo('/timeline')"
    >
      <IconTimeline />
      <span class="text-[9px] font-semibold tracking-[0.5px] uppercase">Timeline</span>
    </button>
    <button
      :class="[
        'flex flex-col items-center gap-1 p-2 transition-colors',
        route.path.startsWith('/matrix') ? 'text-black' : 'text-gray-400',
      ]"
      @click="navigateTo('/matrix')"
    >
      <IconMatrix />
      <span class="text-[9px] font-semibold tracking-[0.5px] uppercase">Matrix</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()
</script>
