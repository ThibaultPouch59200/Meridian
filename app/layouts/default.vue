<template>
  <div class="flex w-full h-screen overflow-hidden bg-gray-50">
    <AppSidebar />
    <div class="flex-1 min-w-0 border-l border-gray-200 bg-white flex flex-col h-screen overflow-hidden">
      <slot />
    </div>
  </div>
</template>
