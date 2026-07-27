// Simple localStorage-backed persistence for trips.
const KEY = 'transport-khata:trips'

export function loadTrips() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveTrips(trips) {
  localStorage.setItem(KEY, JSON.stringify(trips))
}

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}
