export type TransactionType = 'buy' | 'sell'

export interface Transaction {
  id: string
  date: string // ISO date, e.g. 2026-07-03
  type: TransactionType
  grams: number
  pricePerGram: number
  currency: string
  totalAmount: number
  vendor?: string
  notes?: string
}

export interface Settings {
  currency: string
}

export interface Manifest {
  appId: 'digital-gold-tracker'
  schemaVersion: 1
  fileLabel: string
  createdAt: string
  updatedAt: string
}

export interface PortfolioFile {
  manifest: Manifest
  transactions: Transaction[]
  settings: Settings
}

export type SignalStatus = 'BUY' | 'SELL' | 'HOLD' | 'ACCUMULATING_HISTORY'

export interface GoldSignal {
  status: SignalStatus
  asOf: string
  priceUsdPerOz: number
  trailingHighUsdPerOz: number | null
  pctBelowHigh: number | null
  daysOfHistory: number
  totalHistoryEntries: number
  earliestHistoryDate: string
  message: string
}

export interface PriceHistoryPoint {
  date: string
  priceUsdPerOz: number
}
