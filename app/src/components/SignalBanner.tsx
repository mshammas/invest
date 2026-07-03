import { useEffect, useState } from 'react'
import { fetchGoldSignal } from '../lib/signal'
import type { GoldSignal } from '../types'

const STYLES: Record<GoldSignal['status'], string> = {
  BUY: 'bg-green-50 border-green-300 text-green-900',
  SELL: 'bg-amber-50 border-amber-300 text-amber-900',
  HOLD: 'bg-slate-50 border-slate-300 text-slate-900',
  ACCUMULATING_HISTORY: 'bg-slate-50 border-slate-300 text-slate-600',
}

const LABELS: Record<GoldSignal['status'], string> = {
  BUY: 'Consider buying',
  SELL: 'Consider selling',
  HOLD: 'Hold',
  ACCUMULATING_HISTORY: 'Gathering price history',
}

export function SignalBanner() {
  const [signal, setSignal] = useState<GoldSignal | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetchGoldSignal().then((s) => {
      setSignal(s)
      setLoaded(true)
    })
  }, [])

  if (!loaded) return null
  if (!signal) {
    return (
      <div className="rounded-lg border-2 border-slate-300 bg-slate-50 p-5 text-base text-slate-600">
        Couldn't load today's gold market signal.
      </div>
    )
  }

  return (
    <div className={`rounded-lg border-2 p-5 ${STYLES[signal.status]}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-lg font-bold">{LABELS[signal.status]}</span>
        <span className="text-sm opacity-70">as of {new Date(signal.asOf).toLocaleDateString()}</span>
      </div>
      <p className="mt-2 text-base">{signal.message}</p>
      <p className="mt-2 text-sm opacity-70">
        Heuristic based on public spot gold price trends — not financial advice. Backed by price
        history back to {new Date(signal.earliestHistoryDate).getFullYear()} (
        {signal.totalHistoryEntries.toLocaleString()} data points).
      </p>
    </div>
  )
}
