import { useEffect, useState } from 'react'
import { FileMenu } from './components/FileMenu'
import { Dashboard } from './components/Dashboard'
import { TransactionForm } from './components/TransactionForm'
import { TransactionList } from './components/TransactionList'
import { SignalBanner } from './components/SignalBanner'
import { PriceHistorySection } from './components/PriceHistorySection'
import { createNewPortfolioFile, packPortfolioFile, unpackPortfolioFile, InvalidPortfolioFileError } from './lib/fileFormat'
import { openPortfolioFile, saveAsPortfolioFile, saveToHandle } from './lib/fileSystem'
import { computePortfolioSummary } from './lib/portfolio'
import { loadDraft, saveDraft } from './lib/autosave'
import type { PortfolioFile, Transaction } from './types'

function suggestedFileName(fileLabel: string): string {
  const safe = fileLabel.trim().replace(/[^a-z0-9-_ ]/gi, '').trim() || 'goldtrack'
  return `${safe}.gtrack`
}

export default function App() {
  const [portfolioFile, setPortfolioFile] = useState<PortfolioFile | null>(null)
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null)
  const [currentPriceInput, setCurrentPriceInput] = useState('')
  const [restoredDraft, setRestoredDraft] = useState(false)

  useEffect(() => {
    loadDraft().then((draft) => {
      if (draft) {
        setPortfolioFile(draft)
        setRestoredDraft(true)
      }
    })
  }, [])

  useEffect(() => {
    if (portfolioFile) saveDraft(portfolioFile)
  }, [portfolioFile])

  function handleNew() {
    const label = window.prompt('Name this portfolio file (e.g. "My Digital Gold"):', 'My Digital Gold')
    if (!label) return
    setPortfolioFile(createNewPortfolioFile(label))
    setFileHandle(null)
    setRestoredDraft(false)
  }

  async function handleOpen() {
    const opened = await openPortfolioFile()
    if (!opened) return
    try {
      const file = await unpackPortfolioFile(opened.blob)
      setPortfolioFile(file)
      setFileHandle(opened.handle)
      setRestoredDraft(false)
    } catch (err) {
      if (err instanceof InvalidPortfolioFileError) {
        alert(err.message)
      } else {
        throw err
      }
    }
  }

  async function handleSave() {
    if (!portfolioFile) return
    const blob = await packPortfolioFile(portfolioFile)
    if (fileHandle) {
      await saveToHandle(fileHandle, blob)
    } else {
      const handle = await saveAsPortfolioFile(blob, suggestedFileName(portfolioFile.manifest.fileLabel))
      if (handle) setFileHandle(handle)
    }
  }

  async function handleSaveAs() {
    if (!portfolioFile) return
    const blob = await packPortfolioFile(portfolioFile)
    const handle = await saveAsPortfolioFile(blob, suggestedFileName(portfolioFile.manifest.fileLabel))
    if (handle) setFileHandle(handle)
  }

  function addTransaction(t: Omit<Transaction, 'id'>) {
    if (!portfolioFile) return
    const transaction: Transaction = { ...t, id: crypto.randomUUID() }
    setPortfolioFile({ ...portfolioFile, transactions: [...portfolioFile.transactions, transaction] })
  }

  function deleteTransaction(id: string) {
    if (!portfolioFile) return
    setPortfolioFile({
      ...portfolioFile,
      transactions: portfolioFile.transactions.filter((t) => t.id !== id),
    })
  }

  const parsedPrice = parseFloat(currentPriceInput)
  const currentPricePerGram = parsedPrice > 0 ? parsedPrice : null
  const summary = portfolioFile
    ? computePortfolioSummary(portfolioFile.transactions, currentPricePerGram)
    : null

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-3xl font-bold text-slate-900">GoldTrack</h1>
      <p className="mb-6 text-base text-slate-600">
        Track your Digital Gold investments — all data stays on your device.
      </p>

      <div className="mb-6">
        <SignalBanner />
      </div>

      <div className="mb-6">
        <PriceHistorySection />
      </div>

      <FileMenu
        fileLabel={portfolioFile?.manifest.fileLabel ?? null}
        hasHandle={fileHandle != null}
        onNew={handleNew}
        onOpen={handleOpen}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
      />

      {!portfolioFile && (
        <p className="mt-6 text-base text-slate-600">
          Click <span className="font-semibold">New</span> to start a portfolio, or{' '}
          <span className="font-semibold">Open…</span> an existing .gtrack file.
        </p>
      )}

      {portfolioFile && summary && (
        <div className="mt-6 space-y-6">
          {restoredDraft && !fileHandle && (
            <p className="rounded-lg border-2 border-amber-300 bg-amber-50 p-3 text-base text-amber-800">
              Restored an unsaved session from your last visit. Use Save As… to link it to a file on disk.
            </p>
          )}
          <Dashboard
            summary={summary}
            currency={portfolioFile.settings.currency}
            currentPriceInput={currentPriceInput}
            onCurrentPriceInputChange={setCurrentPriceInput}
          />
          <TransactionForm currency={portfolioFile.settings.currency} onAdd={addTransaction} />
          <TransactionList transactions={portfolioFile.transactions} onDelete={deleteTransaction} />
        </div>
      )}
    </div>
  )
}
