<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 bg-black/[.18] z-[200] flex items-end sm:items-center sm:justify-center"
        @click.self="$emit('update:open', false)"
      >
        <div
          class="bg-white sm:border sm:border-gray-200 sm:rounded-md sm:w-[440px] w-full rounded-t-2xl px-7 pt-7 pb-6 relative shadow-[0_8px_32px_rgba(0,0,0,0.1)] max-h-[90vh] overflow-y-auto sm:max-h-none sm:overflow-visible"
          style="animation: modalIn 0.15s ease"
        >
          <button
            class="absolute top-4 right-4 w-[26px] h-[26px] border border-gray-200 rounded flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 transition-all bg-transparent cursor-pointer"
            @click="$emit('update:open', false)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-3 h-3" style="stroke-width:2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          <h2 class="font-display text-[18px] font-normal tracking-[-0.2px] mb-5">
            {{ isEditing ? 'Modifier l\'événement' : 'Nouvel événement' }}
          </h2>

          <div class="flex flex-col gap-[5px] mb-[14px]">
            <label class="text-[9px] font-semibold tracking-[1.2px] uppercase text-gray-400">Nom</label>
            <input
              ref="nameRef"
              v-model="form.name"
              class="form-input"
              placeholder="Réunion, déjeuner, sport..."
              @keydown.enter="submit"
            />
          </div>

          <div class="flex flex-col gap-[5px] mb-[14px]">
            <label class="text-[9px] font-semibold tracking-[1.2px] uppercase text-gray-400">Description</label>
            <textarea v-model="form.desc" class="form-input resize-none h-[60px] leading-relaxed" placeholder="Optionnel..." />
          </div>

          <div class="flex items-center gap-2 mb-[14px]">
            <input
              id="allDay"
              v-model="form.allDay"
              type="checkbox"
              class="w-[13px] h-[13px] cursor-pointer accent-black"
              @change="onAllDayChange"
            />
            <label for="allDay" class="text-[11px] font-medium text-gray-600 cursor-pointer select-none">
              Journée entière
            </label>
          </div>

          <div v-if="!form.allDay" class="flex gap-3 mb-[14px]">
            <div class="flex flex-col gap-[5px] flex-1">
              <label class="text-[9px] font-semibold tracking-[1.2px] uppercase text-gray-400">Début</label>
              <input v-model="form.start" type="datetime-local" class="form-input" />
            </div>
            <div class="flex flex-col gap-[5px] flex-1">
              <label class="text-[9px] font-semibold tracking-[1.2px] uppercase text-gray-400">Fin</label>
              <input v-model="form.end" type="datetime-local" class="form-input" />
            </div>
          </div>
          <div v-else class="flex gap-3 mb-[14px]">
            <div class="flex flex-col gap-[5px] flex-1">
              <label class="text-[9px] font-semibold tracking-[1.2px] uppercase text-gray-400">Début</label>
              <input v-model="form.startDate" type="date" class="form-input" />
            </div>
            <div class="flex flex-col gap-[5px] flex-1">
              <label class="text-[9px] font-semibold tracking-[1.2px] uppercase text-gray-400">Fin</label>
              <input v-model="form.endDate" type="date" class="form-input" />
            </div>
          </div>

          <div class="flex flex-col gap-[5px] mb-[14px]">
            <label class="text-[9px] font-semibold tracking-[1.2px] uppercase text-gray-400">Lieu</label>
            <input v-model="form.location" class="form-input" placeholder="Bureau, maison, en ligne..." />
          </div>

          <div class="flex flex-col gap-[5px] mb-[14px]">
            <label class="text-[9px] font-semibold tracking-[1.2px] uppercase text-gray-400">Couleur</label>
            <div class="flex gap-2 items-center">
              <ColorSwatch
                v-for="c in EVENT_COLORS"
                :key="c"
                :color="c"
                :selected="form.color === c"
                @select="form.color = $event"
              />
            </div>
          </div>

          <div class="flex flex-col gap-[5px] mb-[14px]">
            <label class="text-[9px] font-semibold tracking-[1.2px] uppercase text-gray-400">Tag</label>
            <div class="flex gap-[6px] flex-wrap items-center">
              <TagChip
                v-for="tag in tagsStore.tags"
                :key="tag.label"
                :label="tag.label"
                :selected="form.tag === tag.label"
                @select="form.tag = $event"
              />
              <template v-if="!addingTag">
                <button
                  class="px-[10px] py-1 rounded-[3px] text-[10px] font-semibold tracking-[0.5px] border border-dashed border-gray-200 text-gray-400 hover:text-black hover:border-black transition-all font-sans bg-transparent cursor-pointer"
                  @click="startAddTag"
                >
                  + Tag
                </button>
              </template>
              <template v-else>
                <input
                  ref="tagInputRef"
                  v-model="newTagValue"
                  class="border border-dashed border-gray-200 rounded-[3px] px-2 py-1 text-[10px] w-[100px] outline-none focus:border-black transition-colors font-sans"
                  placeholder="Nouveau tag..."
                  maxlength="20"
                  @keydown.enter="confirmNewTag"
                  @keydown.escape="addingTag = false; newTagValue = ''"
                />
              </template>
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
            <button
              class="px-4 py-[7px] text-xs border border-gray-200 rounded-[3px] text-gray-600 hover:bg-gray-50 transition-all font-sans bg-transparent cursor-pointer"
              @click="$emit('update:open', false)"
            >
              Annuler
            </button>
            <button class="btn-primary" @click="submit">Enregistrer</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { CalendarEvent } from '~~/types'
import { EVENT_COLORS } from '~/stores/events'
import { useTagsStore } from '~/stores/tags'

const props = defineProps<{
  open: boolean
  initialEvent?: CalendarEvent
  initialDate?: string
  initialStartTime?: string
  initialEndTime?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [event: Omit<CalendarEvent, 'id'>]
}>()

const tagsStore = useTagsStore()
const addingTag = ref(false)
const newTagValue = ref('')
const tagInputRef = ref<HTMLInputElement>()
const nameRef = ref<HTMLInputElement>()

const isEditing = computed(() => !!props.initialEvent)

const form = reactive({
  name: '',
  desc: '',
  allDay: false,
  start: '',
  end: '',
  startDate: '',
  endDate: '',
  location: '',
  color: EVENT_COLORS[0] ?? '#4a90d9',
  tag: tagsStore.tags[0]?.label ?? 'Perso',
})

watch(
  () => props.open,
  async (val) => {
    if (!val) return
    addingTag.value = false
    newTagValue.value = ''
    const date = props.initialDate ?? new Date().toISOString().slice(0, 10)
    if (props.initialEvent) {
      form.name = props.initialEvent.name
      form.desc = props.initialEvent.desc ?? ''
      form.allDay = props.initialEvent.allDay ?? false
      form.start = `${props.initialEvent.startDate}T${props.initialEvent.startTime}`
      form.end = `${props.initialEvent.endDate}T${props.initialEvent.endTime}`
      form.startDate = props.initialEvent.startDate
      form.endDate = props.initialEvent.endDate
      form.location = props.initialEvent.location ?? ''
      form.color = props.initialEvent.color
      form.tag = props.initialEvent.tag
    } else {
      form.name = ''
      form.desc = ''
      form.allDay = false
      form.start = `${date}T${props.initialStartTime ?? '09:00'}`
      form.end = `${date}T${props.initialEndTime ?? '10:00'}`
      form.startDate = date
      form.endDate = date
      form.location = ''
      form.color = EVENT_COLORS[0] ?? '#4a90d9'
      form.tag = tagsStore.tags[0]?.label ?? 'Perso'
    }
    await nextTick()
    nameRef.value?.focus()
  },
)

function onAllDayChange() {
  if (form.allDay) {
    form.startDate = form.start.slice(0, 10)
    form.endDate = form.end.slice(0, 10) || form.start.slice(0, 10)
  } else {
    form.start = `${form.startDate}T00:00`
    form.end = `${form.endDate}T23:59`
  }
}

watch(addingTag, async (val) => {
  if (val) {
    await nextTick()
    tagInputRef.value?.focus()
  }
})

async function startAddTag() {
  addingTag.value = true
}

function confirmNewTag() {
  const val = newTagValue.value.trim()
  if (val) {
    tagsStore.addTag(val)
    form.tag = val
  }
  addingTag.value = false
  newTagValue.value = ''
}

function submit() {
  if (!form.name.trim()) return
  if (form.allDay) {
    if (!form.startDate) return
    const endDate = form.endDate || form.startDate
    if (endDate < form.startDate) return
    emit('save', {
      name: form.name.trim(),
      desc: form.desc || undefined,
      allDay: true,
      startDate: form.startDate,
      startTime: '00:00',
      endDate,
      endTime: '23:59',
      location: form.location || undefined,
      color: form.color,
      tag: form.tag,
      source: 'meridian',
    })
  } else {
    if (!form.start || !form.end) return
    if (form.end <= form.start) return
    const startParts = form.start.split('T')
    const endParts = form.end.split('T')
    emit('save', {
      name: form.name.trim(),
      desc: form.desc || undefined,
      allDay: false,
      startDate: startParts[0] ?? '',
      startTime: (startParts[1] ?? '00:00').slice(0, 5),
      endDate: endParts[0] ?? '',
      endTime: (endParts[1] ?? '00:00').slice(0, 5),
      location: form.location || undefined,
      color: form.color,
      tag: form.tag,
      source: 'meridian',
    })
  }
  emit('update:open', false)
}
</script>
