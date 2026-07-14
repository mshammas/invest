export interface CurrencyOption {
  code: string
  label: string
}

// The main global reserve/trade currencies, plus INR (the app's default
// transaction currency) since it wouldn't otherwise make this list.
export const CURRENCIES: CurrencyOption[] = [
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'JPY', label: 'Japanese Yen' },
  { code: 'CHF', label: 'Swiss Franc' },
  { code: 'AUD', label: 'Australian Dollar' },
  { code: 'CAD', label: 'Canadian Dollar' },
  { code: 'CNY', label: 'Chinese Yuan' },
  { code: 'SGD', label: 'Singapore Dollar' },
  { code: 'INR', label: 'Indian Rupee' },
]

export const GRAMS_PER_TROY_OZ = 31.1034768

export const DEFAULT_CURRENCY = 'INR'

const CURRENCY_PREF_KEY = 'goldtrack-display-currency'
const RATES_CACHE_KEY = 'goldtrack-fx-rates'
const RATES_API_URL = 'https://api.frankfurter.dev/v1/latest?from=USD'

interface RatesCache {
  date: string
  rates: Record<string, number>
}

export function loadDisplayCurrencyPref(): string {
  try {
    return localStorage.getItem(CURRENCY_PREF_KEY) ?? DEFAULT_CURRENCY
  } catch {
    return DEFAULT_CURRENCY
  }
}

export function saveDisplayCurrencyPref(code: string): void {
  try {
    localStorage.setItem(CURRENCY_PREF_KEY, code)
  } catch {
    // Private-browsing or storage-disabled — preference just won't persist.
  }
}

function readRatesCache(): RatesCache | null {
  try {
    const raw = localStorage.getItem(RATES_CACHE_KEY)
    return raw ? (JSON.parse(raw) as RatesCache) : null
  } catch {
    return null
  }
}

function writeRatesCache(cache: RatesCache): void {
  try {
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Same as above — conversion just re-fetches next load.
  }
}

// Rates are USD-based (1 USD = rate[code] units of that currency). Cached
// per-day in localStorage so repeat visits don't re-fetch, and so a fetch
// failure falls back to the last known rates instead of going USD-only.
export async function fetchExchangeRates(): Promise<Record<string, number>> {
  const today = new Date().toISOString().slice(0, 10)
  const cached = readRatesCache()
  if (cached && cached.date === today) return cached.rates

  try {
    const res = await fetch(RATES_API_URL)
    if (!res.ok) throw new Error(`frankfurter.dev request failed: ${res.status}`)
    const data = (await res.json()) as { rates: Record<string, number> }
    const rates: Record<string, number> = { USD: 1, ...data.rates }
    writeRatesCache({ date: today, rates })
    return rates
  } catch {
    return cached?.rates ?? { USD: 1 }
  }
}

export function convertFromUsd(usdAmount: number, currency: string, rates: Record<string, number>): number {
  return usdAmount * (rates[currency] ?? 1)
}

export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}
