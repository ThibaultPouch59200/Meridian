export const HOUR_ROW_PX = 56

export function minutesToPx(minutes: number): number {
  return (minutes / 60) * HOUR_ROW_PX
}

export function pxToMinutes(px: number): number {
  return (px / HOUR_ROW_PX) * 60
}

export function snapToGrid(minutes: number, snap = 15): number {
  return Math.round(minutes / snap) * snap
}

export function minutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(totalMinutes, 24 * 60 - 1))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function timeToMinutes(time: string): number {
  const [h = '0', m = '0'] = time.split(':')
  return parseInt(h) * 60 + parseInt(m)
}
