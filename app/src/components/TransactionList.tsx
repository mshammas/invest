import type { Transaction } from '../types'

interface TransactionListProps {
  transactions: Transaction[]
  onDelete: (id: string) => void
}

function fmtCurrency(n: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(n)
}

function fmtDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function fmtQuantity(grams: number) {
  return grams < 1 ? `${(grams * 1000).toFixed(0)} mg` : `${grams.toFixed(4)} g`
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-base font-medium text-slate-900">{value}</div>
    </div>
  )
}

export function TransactionList({ transactions, onDelete }: TransactionListProps) {
  if (transactions.length === 0) {
    return <p className="text-base text-slate-600">No transactions yet. Add your first buy above.</p>
  }

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date))

  function handleDelete(t: Transaction) {
    if (window.confirm(`Delete this ${t.type} of ${fmtQuantity(t.grams)} on ${fmtDate(t.date)}?`)) {
      onDelete(t.id)
    }
  }

  return (
    <div className="space-y-4">
      {sorted.map((t) => (
        <div key={t.id} className="rounded-lg border-2 border-slate-200 p-5">
          <div className="mb-3 flex items-center justify-between">
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                t.type === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {t.type === 'buy' ? 'Buy' : 'Sell'}
            </span>
            <button
              className="min-h-[44px] rounded-lg px-4 text-base font-medium text-red-700 hover:bg-red-50"
              onClick={() => handleDelete(t)}
            >
              Delete
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Date" value={fmtDate(t.date)} />
            <Field label="Quantity" value={fmtQuantity(t.grams)} />
            <Field label="Price / gram" value={fmtCurrency(t.pricePerGram, t.currency)} />
            <Field label="Total" value={fmtCurrency(t.totalAmount, t.currency)} />
          </div>
          {(t.vendor || t.notes) && (
            <div className="mt-3 grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
              {t.vendor && <Field label="Vendor" value={t.vendor} />}
              {t.notes && <Field label="Notes" value={t.notes} />}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
