#!/usr/bin/env node
// One-off backfill of long-term gold price history from freegoldapi.com
// (public, no API key). Only USD/oz-denominated series are used — the older
// pre-1960 entries in that dataset are GBP historical estimates on a wholly
// different scale and are deliberately excluded. Run manually with
// `node scripts/backfill-gold-history.mjs`; it merges into the existing
// data/gold-price-history.json rather than overwriting it, so it's safe to
// re-run later (e.g. to pull in newer freegoldapi.com data).

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const HISTORY_PATH = path.join(REPO_ROOT, 'data', 'gold-price-history.json')

const SOURCE_URL = 'https://freegoldapi.com/data/latest.json'
const USABLE_SOURCES = new Set(['worldbank', 'yahoo_finance'])

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'))
  } catch {
    return fallback
  }
}

async function main() {
  const res = await fetch(SOURCE_URL)
  if (!res.ok) throw new Error(`freegoldapi.com request failed: ${res.status}`)
  const raw = await res.json()

  const backfill = raw
    .filter((e) => USABLE_SOURCES.has(e.source))
    .map((e) => ({ date: e.date, priceUsdPerOz: e.price }))

  const existing = await readJson(HISTORY_PATH, [])
  const existingDates = new Set(existing.map((e) => e.date))

  // Existing entries (from the live gold-api.com daily cron) always win on
  // a date collision — the backfill only fills in dates we don't already have.
  const merged = [...existing, ...backfill.filter((e) => !existingDates.has(e.date))].sort(
    (a, b) => a.date.localeCompare(b.date),
  )

  await mkdir(path.dirname(HISTORY_PATH), { recursive: true })
  await writeFile(HISTORY_PATH, JSON.stringify(merged, null, 2) + '\n')

  console.log(
    `Backfilled ${merged.length - existing.length} new entries (${backfill.length} available from freegoldapi.com). ` +
      `History now spans ${merged[0]?.date} to ${merged[merged.length - 1]?.date} (${merged.length} entries).`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
