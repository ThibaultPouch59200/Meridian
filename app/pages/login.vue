<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const config = useRuntimeConfig()
const password = ref('')
const error = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  if (localStorage.getItem('meridian_auth') === 'true') {
    navigateTo('/timeline')
  }
  nextTick(() => inputRef.value?.focus())
})

function submit() {
  if (password.value === config.public.appPassword) {
    localStorage.setItem('meridian_auth', 'true')
    navigateTo('/timeline')
  } else {
    error.value = true
    password.value = ''
    nextTick(() => inputRef.value?.focus())
  }
}
</script>

<template>
  <div class="w-full max-w-sm px-6">
    <div class="mb-10 text-center">
      <h1 class="font-display text-4xl italic text-black mb-1">Meridian</h1>
      <p class="text-[11px] tracking-[3px] uppercase text-gray-400 font-sans">Day Planner</p>
    </div>

    <form @submit.prevent="submit" class="space-y-4">
      <div>
        <input
          ref="inputRef"
          v-model="password"
          type="password"
          placeholder="Password"
          autocomplete="current-password"
          class="w-full px-4 py-3 bg-white border rounded text-sm font-sans text-black placeholder-gray-400 outline-none transition-colors"
          :class="error ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-black'"
          @input="error = false"
        />
        <p v-if="error" class="mt-2 text-[11px] text-red-400 tracking-wide">Mot de passe incorrect</p>
      </div>

      <button type="submit" class="btn-primary w-full py-3 text-center">
        Accéder
      </button>
    </form>
  </div>
</template>
