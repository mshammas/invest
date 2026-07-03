import { useState } from 'react'
import type { Transaction, TransactionType } from '../types'

interface TransactionFormProps {
  currency: string
  onAdd: (t: Omit<Transaction, 'id'>) => void
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function TransactionForm({ currency, onAdd }: TransactionFormProps) {
  const [date, setDate] = useState(today())
  const [type, setType] = useState<TransactionType>('buy')
  const [grams, setGrams] = useState('')
  const [pricePerGram, setPricePerGram] = useState('')
  const [vendor, setVendor] = useState('')
  const [notes, setNotes] = useState('')

  const gramsNum = parseFloat(grams)
  const priceNum = parseFloat(pricePerGram)
  const isValid = gramsNum > 0 && priceNum > 0
  const totalAmount = isValid ? gramsNum * priceNum : 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    onAdd({
      date,
      type,
      grams: gramsNum,
      pricePerGram: priceNum,
      currency,
      totalAmount,
      vendor: vendor.trim() || undefined,
      notes: notes.trim() || undefined,
    })
    setGrams('')
    setPricePerGram('')
    setVendor('')
    setNotes('')
  }

  const inputClass = 'mt-1 block w-full rounded-md border border-slate-300 px-2 py-1'

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-4">
      <label className="text-sm text-slate-600">
        Date
        <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} required />
      </label>

      <label className="text-sm text-slate-600">
        Type
        <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as TransactionType)}>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>
      </label>

      <label className="text-sm text-slate-600">
        Grams
        <input
          type="number"
          min="0"
          step="0.0001"
          className={inputClass}
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          required
        />
      </label>

      <label className="text-sm text-slate-600">
        Price / gram ({currency})
        <input
          type="number"
          min="0"
          step="0.01"
          className={inputClass}
          value={pricePerGram}
          onChange={(e) => setPricePerGram(e.target.value)}
          required
        />
      </label>

      <label className="text-sm text-slate-600">
        Vendor (optional)
        <input className={inputClass} value={vendor} onChange={(e) => setVendor(e.target.value)} />
      </label>

      <label className="col-span-2 text-sm text-slate-600">
        Notes (optional)
        <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      <div className="flex flex-col justify-end text-sm text-slate-600">
        Total: <span className="font-medium text-slate-900">{totalAmount.toFixed(2)} {currency}</span>
      </div>

      <div className="col-span-2 flex items-end sm:col-span-4">
        <button
          type="submit"
          disabled={!isValid}
          className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add transaction
        </button>
      </div>
    </form>
  )
}
