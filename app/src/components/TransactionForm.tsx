import { useState } from 'react'
import type { Transaction, TransactionType } from '../types'

interface TransactionFormProps {
  currency: string
  onAdd: (t: Omit<Transaction, 'id'>) => void
}

type QuantityUnit = 'g' | 'mg'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function TransactionForm({ currency, onAdd }: TransactionFormProps) {
  const [date, setDate] = useState(today())
  const [type, setType] = useState<TransactionType>('buy')
  const [quantity, setQuantity] = useState('')
  const [quantityUnit, setQuantityUnit] = useState<QuantityUnit>('mg')
  const [totalAmount, setTotalAmount] = useState('')
  const [vendor, setVendor] = useState('')
  const [notes, setNotes] = useState('')

  const quantityNum = parseFloat(quantity)
  const totalAmountNum = parseFloat(totalAmount)
  const isValid = quantityNum > 0 && totalAmountNum > 0
  const gramsNum = quantityUnit === 'mg' ? quantityNum / 1000 : quantityNum
  const pricePerGram = isValid ? totalAmountNum / gramsNum : 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    onAdd({
      date,
      type,
      grams: gramsNum,
      pricePerGram,
      currency,
      totalAmount: totalAmountNum,
      vendor: vendor.trim() || undefined,
      notes: notes.trim() || undefined,
    })
    setQuantity('')
    setTotalAmount('')
    setVendor('')
    setNotes('')
  }

  const inputClass = 'mt-2 block w-full rounded-lg border-2 border-slate-300 px-3 py-2.5 text-base'
  const labelClass = 'text-base font-medium text-slate-700'

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-5 rounded-lg border-2 border-slate-200 p-5 sm:grid-cols-2"
    >
      <label className={labelClass}>
        Date
        <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} required />
      </label>

      <label className={labelClass}>
        Type
        <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as TransactionType)}>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>
      </label>

      <label className={labelClass}>
        Quantity
        <div className="mt-2 flex gap-2">
          <input
            type="number"
            min="0"
            step="0.001"
            className={`${inputClass} mt-0`}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
          <select
            className="mt-0 rounded-lg border-2 border-slate-300 px-2 text-base"
            value={quantityUnit}
            onChange={(e) => setQuantityUnit(e.target.value as QuantityUnit)}
          >
            <option value="mg">mg</option>
            <option value="g">g</option>
          </select>
        </div>
      </label>

      <label className={labelClass}>
        Total amount ({currency})
        <input
          type="number"
          min="0"
          step="0.01"
          className={inputClass}
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          required
        />
      </label>

      <label className={labelClass}>
        Vendor (optional)
        <input className={inputClass} value={vendor} onChange={(e) => setVendor(e.target.value)} />
      </label>

      <label className={labelClass}>
        Notes (optional)
        <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      <div className="text-base text-slate-700 sm:col-span-2">
        Price / gram:{' '}
        <span className="font-semibold text-slate-900">
          {pricePerGram.toFixed(2)} {currency}
        </span>
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={!isValid}
          className="min-h-[48px] w-full rounded-lg bg-slate-900 px-6 py-3 text-base font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          Add transaction
        </button>
      </div>
    </form>
  )
}
