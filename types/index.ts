export interface CalendarEvent {
  id: string
  name: string
  desc?: string
  allDay?: boolean
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  location?: string
  color: string
  tag: string
}

export interface Task {
  id: string
  text: string
  done: boolean
}

export interface Tag {
  label: string
  builtIn: boolean
}

export type QuadrantId = 'inu' | 'iu' | 'ninu' | 'niu' | 'today' | 'tomorrow'
