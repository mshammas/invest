import { CURRENCIES } from '../lib/currency'

interface CurrencyPickerProps {
  value: string
  onChange: (code: string) => void
}

export function CurrencyPicker({ value, onChange }: CurrencyPickerProps) {
  return (
    <label className="flex items-center gap-2 text-base text-slate-700">
      <span className="font-medium">Show prices in</span>
      <select
        className="min-h-[44px] rounded-lg border-2 border-slate-300 bg-white px-3 text-base font-medium text-slate-900"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} — {c.label}
          </option>
        ))}
      </select>
    </label>
  )
}
