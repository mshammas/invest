# GoldTrack

A local-first web app for tracking Digital Gold investments. All portfolio data
stays on your device — there is no backend and no account. A free GitHub
Actions cron job checks the spot gold market daily and can nudge you on
Telegram when it looks like a good time to buy or sell.

## How it works

- **Your data never leaves your device.** The app runs entirely in the
  browser. You explicitly **Save**/**Open** a `.gtrack` file (a zip archive
  containing your transactions and settings) — there's no server-side storage.
- **Market signal, not personal data.** A scheduled workflow
  (`.github/workflows/gold-signal.yml`) fetches the public spot gold price,
  keeps a running history in `data/gold-price-history.json`, and writes a
  BUY/SELL/HOLD heuristic to `app/public/data/gold-signal.json`, which the app
  reads at runtime. This is the same for everyone who runs this repo — it's
  not specific to your holdings.
- **Alerts via Telegram.** When the signal changes, the workflow messages a
  Telegram bot you control. This is optional — without it configured, the
  in-app banner still shows the latest signal.

## Local development

```sh
cd app
npm install
npm run dev
```

## One-time setup for your own deployment

### 1. Enable GitHub Pages
After the first push to `main`, go to **Settings → Pages** and set **Source**
to **GitHub Actions**. The `deploy.yml` workflow will then build and publish
`app/` on every push to `main`.

### 2. Create a Telegram bot (optional, for alerts)
1. Message [@BotFather](https://t.me/BotFather) on Telegram, send `/newbot`,
   and follow the prompts. You'll get a **bot token**.
2. Send any message to your new bot, then visit
   `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` in a browser to find
   your **chat id** (`message.chat.id` in the JSON response).
3. In your repo, go to **Settings → Secrets and variables → Actions** and add:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`

Without these secrets, `gold-signal.yml` still runs and updates the in-app
signal — it just skips the Telegram notification and logs a warning.

### 3. Manually trigger the signal check
Use the **Run workflow** button on `gold-signal.yml` in the Actions tab to test
it immediately rather than waiting for the daily cron.

### 4. Backfilling long-term price history (optional)
`data/gold-price-history.json` starts out with only whatever the daily cron
has collected since you deployed. To seed it with decades of prior history
instead of waiting, run:

```sh
node scripts/backfill-gold-history.mjs
```

This pulls free, keyless data from [freegoldapi.com](https://freegoldapi.com/)
(World Bank monthly data back to 1960, plus daily data from Yahoo Finance) and
merges in any dates you don't already have — it never overwrites entries the
live daily cron already recorded. Note that this only enriches the historical
record for context; the BUY/SELL/HOLD signal itself only ever looks at the
*actual trailing 90 calendar days*, so backfilled history alone can't produce
a signal — it still needs real recent daily cron runs to accumulate.

## The `.gtrack` file format

A `.gtrack` file is a zip archive containing:
- `manifest.json` — app id, schema version, the file's display name, timestamps
- `portfolio.json` — your buy/sell transactions
- `settings.json` — display currency and preferences

Because it's just a zip, you can inspect or back up a `.gtrack` file with any
standard zip tool if needed.

## Current scope (v1)

- Track buy/sell transactions for Digital Gold with weighted-average cost,
  invested amount, and realized/unrealized P&L (unrealized P&L requires you to
  manually enter a current price/gram, since digital gold rates vary by
  vendor).
- Daily BUY/SELL/HOLD heuristic based on public spot gold price trends
  (dip-from-high / near-high), with Telegram alerts on change.
- Price history chart with a hover tooltip, viewable in any major currency
  (or INR) and per troy oz / gram / 8 grams, converted from the USD spot
  price using free daily FX rates.
- New/Open/Save/Save As, using the File System Access API where supported
  (Chrome/Edge) with a download/upload fallback elsewhere (Safari/Firefox).
- A crash-recovery autosave to IndexedDB — never a substitute for explicitly
  saving your `.gtrack` file.

## Roadmap ideas (not yet built)

- Password-based encryption of the exported file
- CSV export, price/history charts
- XIRR and FIFO capital-gains lot tracking
- PWA/offline support
- User-editable alert thresholds
- Multiple portfolio files / goals
- Vendor-specific pricing (markup over spot gold)
