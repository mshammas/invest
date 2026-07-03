import type { GoldSignal } from '../types'

export async function fetchGoldSignal(): Promise<GoldSignal | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/gold-signal.json`, { cache: 'no-cache' })
    if (!res.ok) return null
    return (await res.json()) as GoldSignal
  } catch {
    return null
  }
}
