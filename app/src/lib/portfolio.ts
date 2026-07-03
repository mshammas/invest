import type { Transaction } from '../types'

export interface PortfolioSummary {
  gramsHeld: number
  investedAmount: number
  avgCostPerGram: number
  realizedPnL: number
  currentPricePerGram: number | null
  currentValue: number | null
  unrealizedPnL: number | null
}

/** Running weighted-average-cost accounting (moving average method) over transactions in date order. */
export function computePortfolioSummary(
  transactions: Transaction[],
  currentPricePerGram: number | null,
): PortfolioSummary {
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date))

  let grams = 0
  let investedAmount = 0
  let avgCost = 0
  let realizedPnL = 0

  for (const t of sorted) {
    if (t.type === 'buy') {
      const newGrams = grams + t.grams
      investedAmount += t.totalAmount
      avgCost = newGrams > 0 ? investedAmount / newGrams : 0
      grams = newGrams
    } else {
      const costBasisRemoved = t.grams * avgCost
      realizedPnL += t.totalAmount - costBasisRemoved
      investedAmount -= costBasisRemoved
      grams -= t.grams
      if (grams <= 0) {
        grams = 0
        investedAmount = 0
        avgCost = 0
      }
    }
  }

  const currentValue = currentPricePerGram != null ? grams * currentPricePerGram : null
  const unrealizedPnL = currentValue != null ? currentValue - investedAmount : null

  return {
    gramsHeld: grams,
    investedAmount,
    avgCostPerGram: avgCost,
    realizedPnL,
    currentPricePerGram,
    currentValue,
    unrealizedPnL,
  }
}
