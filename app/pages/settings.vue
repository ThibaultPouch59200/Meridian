<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <header class="border-b border-gray-200 dark:border-[#2e2e2e] flex-shrink-0 px-4 sm:px-7 sm:pl-6 pt-[14px] pb-[14px]">
      <span class="font-display text-[20px] font-normal tracking-[-0.3px]">Settings</span>
    </header>

    <div class="flex-1 overflow-y-auto px-4 sm:px-7 sm:pl-6 py-6 max-w-[560px]">

      <!-- Apparence -->
      <div class="mb-8">
        <p class="section-label mb-3">Apparence</p>
        <div class="flex gap-1">
          <button
            v-for="opt in themeOptions"
            :key="opt.value"
            :class="[
              'px-[10px] py-[5px] text-[11px] font-medium tracking-[0.5px] border rounded-[4px] transition-all font-sans cursor-pointer',
              themeStore.theme === opt.value
                ? 'bg-black text-white border-black dark:bg-[#f0f0ee] dark:text-[#0d0d0d] dark:border-[#f0f0ee]'
                : 'bg-transparent text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-black dark:text-gray-400 dark:border-[#2e2e2e] dark:hover:bg-[#252525] dark:hover:text-[#f0f0ee]',
            ]"
            @click="themeStore.setTheme(opt.value)"
          >{{ opt.label }}</button>
        </div>
      </div>

      <!-- Google Calendar section -->
      <div class="mb-8">
        <p class="section-label mb-3">Google Calendar</p>

        <!-- Not connected -->
        <div v-if="!googleStore.isConnected">
          <div class="border border-gray-200 dark:border-[#2e2e2e] rounded-md p-4 flex items-center justify-between gap-4">
            <div>
              <p class="text-[13px] font-semibold text-black dark:text-[#f0f0ee] mb-[2px]">Connecter un compte Google</p>
              <p class="text-[11px] text-gray-400">Importe tes calendriers et synchronise tes événements</p>
            </div>
            <button class="btn-primary whitespace-nowrap flex-shrink-0" @click="connectGoogle">
              Connecter
            </button>
          </div>
        </div>

        <!-- Connected -->
        <div v-else>
          <!-- Account row -->
          <div class="border border-gray-200 dark:border-[#2e2e2e] rounded-md p-3 flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-[12px] font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">
                {{ googleStore.account!.googleEmail[0]?.toUpperCase() }}
              </div>
              <div>
                <p class="text-[12px] font-semibold text-black dark:text-[#f0f0ee]">{{ googleStore.account!.googleEmail }}</p>
                <p class="text-[10px] text-gray-400">
                  {{ googleStore.lastSyncedAt ? `Dernière sync : ${timeSince(googleStore.lastSyncedAt)}` : 'Non synchronisé' }}
                </p>
              </div>
            </div>
            <button
              class="px-3 py-[5px] text-[10px] font-semibold border border-red-300 text-red-500 rounded-[3px] hover:bg-red-50 dark:hover:bg-red-900/20 transition-all bg-transparent cursor-pointer"
              :disabled="disconnecting"
              @click="disconnect"
            >
              {{ disconnecting ? '…' : 'Déconnecter' }}
            </button>
          </div>

          <!-- Calendar selection step (right after OAuth) -->
          <div v-if="route.query.step === 'calendars'" class="mb-4">
            <p class="section-label mb-2">Sélectionne tes calendriers</p>
            <div v-if="loadingCals" class="text-[11px] text-gray-400 py-2">Chargement…</div>
            <div v-else-if="calsError" class="text-[11px] text-red-500 py-2 flex items-start gap-2">
              <span class="flex-1">Impossible de charger les calendriers : {{ calsError }}</span>
              <button class="underline cursor-pointer bg-transparent border-none text-red-400 flex-shrink-0" @click="fetchAvailableCals">Réessayer</button>
            </div>
            <div v-else class="flex flex-col gap-2">
              <label
                v-for="cal in availableCals"
                :key="cal.id"
                class="flex items-center gap-3 border border-gray-200 dark:border-[#2e2e2e] rounded-[5px] p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
              >
                <input
                  v-model="cal.selected"
                  :true-value="1"
                  :false-value="0"
                  type="checkbox"
                  class="w-[13px] h-[13px] cursor-pointer accent-black flex-shrink-0"
                />
                <span
                  class="w-3 h-3 rounded-full flex-shrink-0"
                  :style="{ background: cal.color }"
                />
                <span class="text-[12px] font-medium text-black dark:text-[#f0f0ee] flex-1">{{ cal.name }}</span>
              </label>
            </div>
            <button
              class="btn-primary mt-3 w-full"
              :disabled="savingCals"
              @click="saveCalendars"
            >
              {{ savingCals ? '…' : 'Confirmer' }}
            </button>
          </div>

          <!-- Calendars list (normal settings view) -->
          <div v-else>
            <p class="section-label mb-2">Calendriers</p>
            <div v-if="googleStore.calendars.length === 0" class="text-[11px] text-gray-400 py-2">
              Aucun calendrier sélectionné.
              <button class="underline cursor-pointer bg-transparent border-none text-gray-400" @click="goSelectCalendars">
                Modifier
              </button>
            </div>
            <div v-else class="flex flex-col gap-2">
              <div
                v-for="cal in googleStore.calendars"
                :key="cal.id"
                class="flex items-center justify-between border border-gray-200 dark:border-[#2e2e2e] rounded-[5px] p-3"
              >
                <div class="flex items-center gap-3">
                  <span class="w-3 h-3 rounded-full flex-shrink-0" :style="{ background: cal.color }" />
                  <span class="text-[12px] font-medium text-black dark:text-[#f0f0ee]">{{ cal.name }}</span>
                </div>
                <!-- Color override swatches -->
                <div class="flex gap-[5px] items-center">
                  <button
                    v-for="c in EVENT_COLORS"
                    :key="c"
                    class="w-[13px] h-[13px] rounded-full flex-shrink-0 cursor-pointer border-2 transition-all"
                    :style="{
                      background: c,
                      borderColor: cal.color === c ? '#0d0d0d' : 'transparent',
                    }"
                    :title="c"
                    @click="googleStore.updateCalendarColor(cal.id, c).then(() => eventsStore.fetch())"
                  />
                </div>
              </div>
              <button
                class="text-[10px] text-gray-400 underline text-left bg-transparent border-none cursor-pointer mt-1"
                @click="goSelectCalendars"
              >
                Modifier la sélection
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useGoogleStore } from '~/stores/google'
import { useEventsStore, EVENT_COLORS } from '~/stores/events'
import { useThemeStore } from '~/stores/theme'

const googleStore = useGoogleStore()
const eventsStore = useEventsStore()
const themeStore = useThemeStore()
const route = useRoute()
const router = useRouter()

const themeOptions = [
  { value: 'light' as const, label: 'Clair' },
  { value: 'system' as const, label: 'Système' },
  { value: 'dark' as const, label: 'Sombre' },
]

const disconnecting = ref(false)
const loadingCals = ref(false)
const savingCals = ref(false)
const availableCals = ref<Array<{ id: string; name: string; color: string; selected: number }>>([])
const calsError = ref<string | null>(null)

async function fetchAvailableCals() {
  loadingCals.value = true
  calsError.value = null
  try {
    availableCals.value = await $fetch('/api/google/calendars')
  }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    calsError.value = msg
  }
  finally {
    loadingCals.value = false
  }
}

onMounted(() => {
  if (route.query.step === 'calendars') {
    fetchAvailableCals()
  }
})

watch(
  () => googleStore.isConnected,
  (connected) => {
    if (connected && route.query.step === 'calendars' && availableCals.value.length === 0 && !loadingCals.value) {
      fetchAvailableCals()
    }
  },
)

function connectGoogle() {
  window.location.href = '/api/auth/google/redirect'
}

async function disconnect() {
  disconnecting.value = true
  try {
    await googleStore.disconnect()
    await eventsStore.fetch()
  }
  finally {
    disconnecting.value = false
  }
}

async function saveCalendars() {
  savingCals.value = true
  try {
    await googleStore.saveCalendarSelection(
      availableCals.value.map(c => ({
        id: c.id,
        name: c.name,
        color: c.color,
        selected: c.selected === 1,
      })),
    )
    await googleStore.sync()
    await eventsStore.fetch()
    router.replace('/settings')
  }
  finally {
    savingCals.value = false
  }
}

function goSelectCalendars() {
  router.push('/settings?step=calendars')
}

function timeSince(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'à l\'instant'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  return `il y a ${Math.floor(diff / 3600)} h`
}
</script>
