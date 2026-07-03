import type { PortfolioSummary } from '../lib/portfolio'

interface DashboardProps {
  summary: PortfolioSummary
  currency: string
  currentPriceInput: string
  onCurrentPriceInputChange: (value: string) => void
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(n)
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  const toneClass = tone === 'good' ? 'text-green-700' : tone === 'bad' ? 'text-red-700' : 'text-slate-900'
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${toneClass}`}>{value}</div>
    </div>
  )
}

export function Dashboard({ summary, currency, currentPriceInput, onCurrentPriceInputChange }: DashboardProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Grams held" value={summary.gramsHeld.toFixed(4)} />
        <Stat label="Invested (cost basis)" value={fmt(summary.investedAmount, currency)} />
        <Stat label="Avg cost / gram" value={fmt(summary.avgCostPerGram, currency)} />
        <Stat
          label="Realized P&L"
          value={fmt(summary.realizedPnL, currency)}
          tone={summary.realizedPnL > 0 ? 'good' : summary.realizedPnL < 0 ? 'bad' : undefined}
        />
        {summary.currentValue != null && (
          <Stat label="Current value" value={fmt(summary.currentValue, currency)} />
        )}
        {summary.unrealizedPnL != null && (
          <Stat
            label="Unrealized P&L"
            value={fmt(summary.unrealizedPnL, currency)}
            tone={summary.unrealizedPnL > 0 ? 'good' : summary.unrealizedPnL < 0 ? 'bad' : undefined}
          />
        )}
      </div>

      <label className="block text-sm text-slate-600">
        Current price / gram (optional, enter your vendor's rate to see live value)
        <input
          type="number"
          min="0"
          step="0.01"
          className="mt-1 block w-48 rounded-md border border-slate-300 px-2 py-1"
          value={currentPriceInput}
          onChange={(e) => onCurrentPriceInputChange(e.target.value)}
          placeholder={`e.g. 6500 ${currency}/g`}
        />
      </label>
    </div>
  )
}
