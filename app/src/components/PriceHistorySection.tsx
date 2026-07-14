import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchGoldPriceHistory } from '../lib/priceHistory'
import type { PriceHistoryPoint } from '../types'

const INK = '#0b0b0b'
const INK_SECONDARY = '#52514e'
const INK_MUTED = '#898781'
const GRIDLINE = '#e1e0d9'
const BASELINE = '#c3c2b7'
const SERIES = '#2a78d6'

type RangeKey = '30D' | '90D' | '1Y' | '5Y' | 'All'

const RANGE_OPTIONS: { key: RangeKey; label: string; days: number }[] = [
  { key: '30D', label: '30 days', days: 30 },
  { key: '90D', label: '90 days', days: 90 },
  { key: '1Y', label: '1 year', days: 365 },
  { key: '5Y', label: '5 years', days: 365 * 5 },
  { key: 'All', label: 'All', days: Infinity },
]

const VIEW_W = 800
const VIEW_H = 320
const PAD = { top: 20, right: 76, bottom: 36, left: 68 }
const PLOT_W = VIEW_W - PAD.left - PAD.right
const PLOT_H = VIEW_H - PAD.top - PAD.bottom

function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) return [min]
  const rawStep = (max - min) / (count - 1)
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const residual = rawStep / magnitude
  const step = residual > 5 ? 10 * magnitude : residual > 2 ? 5 * magnitude : residual > 1 ? 2 * magnitude : magnitude
  const niceMin = Math.floor(min / step) * step
  const ticks: number[] = []
  for (let v = niceMin; v <= max + step / 2; v += step) ticks.push(Math.round(v * 100) / 100)
  return ticks
}

function fmtUsd(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n)
}

function fmtDateShort(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtDateAxis(iso: string, spanDays: number): string {
  const d = new Date(`${iso}T00:00:00`)
  if (spanDays > 731) return d.toLocaleDateString(undefined, { year: 'numeric' })
  if (spanDays > 120) return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function PriceHistorySection() {
  const [history, setHistory] = useState<PriceHistoryPoint[] | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [range, setRange] = useState<RangeKey>('30D')
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchGoldPriceHistory().then((h) => {
      setHistory(h)
      setLoaded(true)
    })
  }, [])

  const points = useMemo(() => {
    if (!history || history.length === 0) return []
    const rangeDays = RANGE_OPTIONS.find((r) => r.key === range)!.days
    if (!Number.isFinite(rangeDays)) return history
    const lastDate = new Date(`${history[history.length - 1].date}T00:00:00Z`)
    const cutoff = new Date(lastDate)
    cutoff.setUTCDate(cutoff.getUTCDate() - rangeDays)
    const cutoffIso = cutoff.toISOString().slice(0, 10)
    return history.filter((e) => e.date >= cutoffIso)
  }, [history, range])

  const geometry = useMemo(() => {
    if (points.length === 0) return null
    const times = points.map((p) => new Date(`${p.date}T00:00:00Z`).getTime())
    const values = points.map((p) => p.priceUsdPerOz)
    const minT = times[0]
    const maxT = times[times.length - 1]
    const rawMinV = Math.min(...values)
    const rawMaxV = Math.max(...values)
    const vPad = (rawMaxV - rawMinV) * 0.08 || rawMaxV * 0.02 || 1
    const minV = rawMinV - vPad
    const maxV = rawMaxV + vPad

    const xScale = (t: number) => PAD.left + (maxT === minT ? PLOT_W / 2 : ((t - minT) / (maxT - minT)) * PLOT_W)
    const yScale = (v: number) => PAD.top + (1 - (v - minV) / (maxV - minV)) * PLOT_H

    const pixels = points.map((p, i) => ({ x: xScale(times[i]), y: yScale(p.priceUsdPerOz) }))
    const path = pixels.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ')
    // Ticks are generated from the padded domain (not the raw data range) and
    // then clamped, so a rounded-up top/bottom tick can never render outside
    // the plot area and get clipped by the chart's edge.
    const yTicks = niceTicks(minV, maxV, 4).filter((t) => t >= minV && t <= maxV)
    const spanDays = (maxT - minT) / 86_400_000
    const xTickIdx = [0, Math.floor((points.length - 1) / 2), points.length - 1]

    return { pixels, path, yTicks, yScale, spanDays, xTickIdx, minT, maxT }
  }, [points])

  if (!loaded) return null
  if (!history || history.length === 0 || !geometry) {
    return (
      <div className="rounded-lg border-2 border-slate-200 p-5 text-base text-slate-600">
        Price history isn't available yet.
      </div>
    )
  }

  const latest = points[points.length - 1]
  const hovered = hoverIndex != null ? points[hoverIndex] : null
  const hoveredPixel = hoverIndex != null ? geometry.pixels[hoverIndex] : null

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect || points.length === 0) return
    const fracX = (e.clientX - rect.left) / rect.width
    const targetT = geometry!.minT + fracX * (geometry!.maxT - geometry!.minT)
    let nearest = 0
    let best = Infinity
    for (let i = 0; i < points.length; i++) {
      const t = new Date(`${points[i].date}T00:00:00Z`).getTime()
      const d = Math.abs(t - targetT)
      if (d < best) {
        best = d
        nearest = i
      }
    }
    setHoverIndex(nearest)
  }

  const tooltipLeftPct = hoveredPixel ? Math.min(92, Math.max(8, (hoveredPixel.x / VIEW_W) * 100)) : 0
  const tooltipTopPct = hoveredPixel ? (hoveredPixel.y / VIEW_H) * 100 : 0

  return (
    <div className="rounded-lg border-2 border-slate-200 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">Gold price history (USD / troy oz)</h2>
        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setRange(opt.key)}
              className={`min-h-[40px] rounded-lg border-2 px-3 text-sm font-medium ${
                range === opt.key
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative touch-none select-none"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full" role="img" aria-label="Gold spot price over time">
          {geometry.yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={VIEW_W - PAD.right}
                y1={geometry.yScale(tick)}
                y2={geometry.yScale(tick)}
                stroke={GRIDLINE}
                strokeWidth={1}
              />
              <text x={PAD.left - 8} y={geometry.yScale(tick)} dy="0.32em" textAnchor="end" fontSize={12} fill={INK_MUTED}>
                ${tick.toLocaleString()}
              </text>
            </g>
          ))}

          <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={VIEW_H - PAD.bottom} stroke={BASELINE} strokeWidth={1} />
          <line
            x1={PAD.left}
            x2={VIEW_W - PAD.right}
            y1={VIEW_H - PAD.bottom}
            y2={VIEW_H - PAD.bottom}
            stroke={BASELINE}
            strokeWidth={1}
          />

          {geometry.xTickIdx.map((idx, i) => (
            <text
              key={i}
              x={geometry.pixels[idx].x}
              y={VIEW_H - PAD.bottom + 20}
              textAnchor={i === 0 ? 'start' : i === geometry.xTickIdx.length - 1 ? 'end' : 'middle'}
              fontSize={12}
              fill={INK_MUTED}
            >
              {fmtDateAxis(points[idx].date, geometry.spanDays)}
            </text>
          ))}

          <path d={geometry.path} fill="none" stroke={SERIES} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          <circle cx={geometry.pixels[geometry.pixels.length - 1].x} cy={geometry.pixels[geometry.pixels.length - 1].y} r={4} fill={SERIES} stroke="#fff" strokeWidth={2} />
          <text
            x={geometry.pixels[geometry.pixels.length - 1].x + 8}
            y={geometry.pixels[geometry.pixels.length - 1].y}
            dy="0.32em"
            fontSize={13}
            fontWeight={600}
            fill={INK}
          >
            {fmtUsd(latest.priceUsdPerOz)}
          </text>

          {hoveredPixel && (
            <>
              <line x1={hoveredPixel.x} x2={hoveredPixel.x} y1={PAD.top} y2={VIEW_H - PAD.bottom} stroke={BASELINE} strokeWidth={1} />
              <circle cx={hoveredPixel.x} cy={hoveredPixel.y} r={5} fill={SERIES} stroke="#fff" strokeWidth={2} />
            </>
          )}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[120%] whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-md"
            style={{ left: `${tooltipLeftPct}%`, top: `${tooltipTopPct}%` }}
          >
            <div className="font-semibold text-slate-900">{fmtUsd(hovered.priceUsdPerOz)}</div>
            <div className="text-slate-600">{fmtDateShort(hovered.date)}</div>
          </div>
        )}
      </div>

      <p className="mt-2 text-sm text-slate-600" style={{ color: INK_SECONDARY }}>
        {points.length.toLocaleString()} data points shown. Move your finger or mouse over the line to see a
        specific day's price.
      </p>

      <DailyRateTable points={points} />
    </div>
  )
}

function DailyRateTable({ points }: { points: PriceHistoryPoint[] }) {
  const [expanded, setExpanded] = useState(false)
  const rows = [...points].reverse()
  const visibleRows = expanded ? rows.slice(0, 200) : rows.slice(0, 14)

  return (
    <div className="mt-5 border-t-2 border-slate-100 pt-4">
      <h3 className="mb-3 text-base font-semibold text-slate-900">Daily rates</h3>
      <div className="space-y-2">
        {visibleRows.map((p) => (
          <div key={p.date} className="flex items-center justify-between rounded-md bg-slate-50 px-4 py-2.5">
            <span className="text-base text-slate-700">{fmtDateShort(p.date)}</span>
            <span className="text-base font-semibold tabular-nums text-slate-900">{fmtUsd(p.priceUsdPerOz)}</span>
          </div>
        ))}
      </div>
      {rows.length > 14 && (
        <button
          className="mt-3 min-h-[44px] rounded-lg border-2 border-slate-300 px-4 text-base font-medium text-slate-700 hover:bg-slate-100"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Show fewer' : `Show more (${Math.min(rows.length, 200).toLocaleString()} total in range)`}
        </button>
      )}
    </div>
  )
}
