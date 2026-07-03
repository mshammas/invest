import type { Transaction } from '../types'

interface TransactionListProps {
  transactions: Transaction[]
  onDelete: (id: string) => void
}

export function TransactionList({ transactions, onDelete }: TransactionListProps) {
  if (transactions.length === 0) {
    return <p className="text-sm text-slate-500">No transactions yet. Add your first buy above.</p>
  }

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
          <th className="py-2">Date</th>
          <th>Type</th>
          <th>Grams</th>
          <th>Price/g</th>
          <th>Total</th>
          <th>Vendor</th>
          <th>Notes</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((t) => (
          <tr key={t.id} className="border-b border-slate-100">
            <td className="py-2">{t.date}</td>
            <td className={t.type === 'buy' ? 'text-green-700' : 'text-red-700'}>{t.type}</td>
            <td>{t.grams}</td>
            <td>{t.pricePerGram}</td>
            <td>
              {t.totalAmount.toFixed(2)} {t.currency}
            </td>
            <td>{t.vendor ?? '—'}</td>
            <td className="max-w-[12rem] truncate">{t.notes ?? '—'}</td>
            <td>
              <button className="text-xs text-red-600 hover:underline" onClick={() => onDelete(t.id)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
