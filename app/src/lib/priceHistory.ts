import type { PriceHistoryPoint } from '../types'

export async function fetchGoldPriceHistory(): Promise<PriceHistoryPoint[] | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/gold-price-history.json`, { cache: 'no-cache' })
    if (!res.ok) return null
    return (await res.json()) as PriceHistoryPoint[]
  } catch {
    return null
  }
}
