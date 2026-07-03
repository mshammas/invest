#!/usr/bin/env node
// Fetches the current spot gold price, updates the price history, computes a
// simple BUY/SELL/HOLD heuristic, writes the result for the app to read, and
// notifies Telegram when the signal changes. Deliberately dependency-free —
// run with plain `node` in the GitHub Actions cron workflow.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const HISTORY_PATH = path.join(REPO_ROOT, 'data', 'gold-price-history.json')
const SIGNAL_PATH = path.join(REPO_ROOT, 'app', 'public', 'data', 'gold-signal.json')

const PRICE_API_URL = 'https://api.gold-api.com/price/XAU'
const TRAILING_WINDOW_DAYS = 90
const MIN_HISTORY_DAYS = 14
const BUY_DIP_THRESHOLD = 0.05 // 5% below trailing high
const SELL_NEAR_HIGH_THRESHOLD = 0.01 // within 1% of trailing high
// Generous cap — long-term backfilled history (years, monthly granularity)
// plus decades of future daily entries should never come close to this.
const MAX_HISTORY_ENTRIES = 20000

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'))
  } catch {
    return fallback
  }
}

async function fetchSpotPriceUsdPerOz() {
  const res = await fetch(PRICE_API_URL)
  if (!res.ok) throw new Error(`gold-api.com request failed: ${res.status}`)
  const data = await res.json()
  if (typeof data.price !== 'number') throw new Error('Unexpected response shape from gold-api.com')
  return data.price
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function daysBeforeIso(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

// Uses a calendar-day window (not "last N entries") so that deep backfilled
// history — which may have a gap between its cutoff and today — can never be
// mistaken for real recent coverage. Only entries actually within the
// trailing window count towards the signal or the min-history gate.
function computeSignal(history, todayDate) {
  const cutoff = daysBeforeIso(todayDate, TRAILING_WINDOW_DAYS)
  const windowEntries = history.filter((e) => e.date >= cutoff && e.date <= todayDate)
  const trailingHigh = Math.max(...windowEntries.map((e) => e.priceUsdPerOz))
  const latest = windowEntries[windowEntries.length - 1].priceUsdPerOz
  const pctBelowHigh = (trailingHigh - latest) / trailingHigh

  if (windowEntries.length < MIN_HISTORY_DAYS) {
    return {
      status: 'ACCUMULATING_HISTORY',
      trailingHighUsdPerOz: trailingHigh,
      pctBelowHigh,
      daysOfHistory: windowEntries.length,
      message: `Still building up recent price history (${windowEntries.length}/${MIN_HISTORY_DAYS} days) before suggesting buy/sell timing.`,
    }
  }

  if (pctBelowHigh >= BUY_DIP_THRESHOLD) {
    return {
      status: 'BUY',
      trailingHighUsdPerOz: trailingHigh,
      pctBelowHigh,
      daysOfHistory: windowEntries.length,
      message: `Spot gold is ${(pctBelowHigh * 100).toFixed(1)}% below its ${TRAILING_WINDOW_DAYS}-day high — historically a reasonable time to add to a position.`,
    }
  }

  if (pctBelowHigh <= SELL_NEAR_HIGH_THRESHOLD) {
    return {
      status: 'SELL',
      trailingHighUsdPerOz: trailingHigh,
      pctBelowHigh,
      daysOfHistory: windowEntries.length,
      message: `Spot gold is within ${(SELL_NEAR_HIGH_THRESHOLD * 100).toFixed(0)}% of its ${TRAILING_WINDOW_DAYS}-day high — consider taking some profit.`,
    }
  }

  return {
    status: 'HOLD',
    trailingHighUsdPerOz: trailingHigh,
    pctBelowHigh,
    daysOfHistory: windowEntries.length,
    message: `Spot gold is ${(pctBelowHigh * 100).toFixed(1)}% below its ${TRAILING_WINDOW_DAYS}-day high — no strong signal either way.`,
  }
}

async function notifyTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) {
    console.warn('TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set — skipping Telegram notification.')
    return
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
  if (!res.ok) {
    console.error(`Telegram notification failed: ${res.status} ${await res.text()}`)
  }
}

async function main() {
  const price = await fetchSpotPriceUsdPerOz()
  const date = todayIso()

  const history = await readJson(HISTORY_PATH, [])
  const withoutToday = history.filter((e) => e.date !== date)
  const updatedHistory = [...withoutToday, { date, priceUsdPerOz: price }]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-MAX_HISTORY_ENTRIES)

  const previousSignal = await readJson(SIGNAL_PATH, null)
  const computed = computeSignal(updatedHistory, date)

  const signal = {
    status: computed.status,
    asOf: new Date().toISOString(),
    priceUsdPerOz: price,
    trailingHighUsdPerOz: computed.trailingHighUsdPerOz,
    pctBelowHigh: computed.pctBelowHigh,
    daysOfHistory: computed.daysOfHistory,
    totalHistoryEntries: updatedHistory.length,
    earliestHistoryDate: updatedHistory[0]?.date ?? date,
    message: computed.message,
  }

  await mkdir(path.dirname(HISTORY_PATH), { recursive: true })
  await mkdir(path.dirname(SIGNAL_PATH), { recursive: true })
  await writeFile(HISTORY_PATH, JSON.stringify(updatedHistory, null, 2) + '\n')
  await writeFile(SIGNAL_PATH, JSON.stringify(signal, null, 2) + '\n')

  console.log(`Gold signal: ${signal.status} (price $${price}/oz, ${signal.message})`)

  if (!previousSignal || previousSignal.status !== signal.status) {
    await notifyTelegram(`GoldTrack signal changed: ${signal.status}\n\n${signal.message}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
