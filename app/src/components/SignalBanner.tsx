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
      <div className="rounded-lg border border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
        Couldn't load today's gold market signal.
      </div>
    )
  }

  return (
    <div className={`rounded-lg border p-4 ${STYLES[signal.status]}`}>
      <div className="flex items-center justify-between gap-4">
        <span className="font-semibold">{LABELS[signal.status]}</span>
        <span className="text-xs opacity-70">
          as of {new Date(signal.asOf).toLocaleDateString()}
        </span>
      </div>
      <p className="mt-1 text-sm">{signal.message}</p>
      <p className="mt-1 text-xs opacity-60">
        Heuristic based on public spot gold price trends — not financial advice.
      </p>
    </div>
  )
}
