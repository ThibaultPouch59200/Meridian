<template>
  <div class="flex w-full h-screen overflow-hidden bg-gray-50">
    <AppSidebar />
    <div class="flex-1 min-w-0 sm:border-l border-gray-200 bg-white flex flex-col h-screen overflow-hidden pb-14 sm:pb-0">
      <slot />
    </div>
  </div>
</template>
