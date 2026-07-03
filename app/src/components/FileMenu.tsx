interface FileMenuProps {
  fileLabel: string | null
  hasHandle: boolean
  onNew: () => void
  onOpen: () => void
  onSave: () => void
  onSaveAs: () => void
}

const buttonClass =
  'rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100'

export function FileMenu({ fileLabel, hasHandle, onNew, onOpen, onSave, onSaveAs }: FileMenuProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
      <button className={buttonClass} onClick={onNew}>
        New
      </button>
      <button className={buttonClass} onClick={onOpen}>
        Open…
      </button>
      <button
        className={`${buttonClass} disabled:cursor-not-allowed disabled:opacity-40`}
        onClick={onSave}
        disabled={!fileLabel}
      >
        Save
      </button>
      <button
        className={`${buttonClass} disabled:cursor-not-allowed disabled:opacity-40`}
        onClick={onSaveAs}
        disabled={!fileLabel}
      >
        Save As…
      </button>
      <span className="ml-auto text-sm text-slate-500">
        {fileLabel ? (
          <>
            <span className="font-medium text-slate-700">{fileLabel}</span>
            {!hasHandle && <span className="ml-1">(not linked to a file on disk yet)</span>}
          </>
        ) : (
          'No file open'
        )}
      </span>
    </div>
  )
}
