export const BASE_HOUR = 10    // 10am
export const SLOT_COUNT = 28   // 10am – 11:30pm
export const DAY_COUNT = 28
export const MAX_WEEK_OFFSET = Math.ceil(DAY_COUNT / 7) - 1

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function getBaseDate() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function slotLabel(slotIdx) {
  const h = BASE_HOUR + Math.floor(slotIdx / 2)
  const m = (slotIdx % 2) * 30
  const ampm = h >= 12 ? 'pm' : 'am'
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h
  return m === 0 ? `${hr}${ampm}` : `${hr}:${m.toString().padStart(2,'0')}`
}

export function dayLabel(baseDate, dayIdx) {
  const d = new Date(baseDate)
  d.setDate(d.getDate() + dayIdx)
  return { name: DAY_NAMES[d.getDay()], date: d.getDate(), month: MONTH_NAMES[d.getMonth()] }
}
