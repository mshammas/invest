interface FileMenuProps {
  fileLabel: string | null
  hasHandle: boolean
  onNew: () => void
  onOpen: () => void
  onSave: () => void
  onSaveAs: () => void
}

const buttonClass =
  'min-h-[48px] rounded-lg border-2 border-slate-300 px-5 py-2.5 text-base font-medium text-slate-800 hover:bg-slate-100 active:bg-slate-200'

export function FileMenu({ fileLabel, hasHandle, onNew, onOpen, onSave, onSaveAs }: FileMenuProps) {
  return (
    <div className="flex flex-col gap-3 border-b-2 border-slate-200 pb-5">
      <div className="flex flex-wrap gap-3">
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
      </div>
      <span className="text-base text-slate-600">
        {fileLabel ? (
          <>
            File: <span className="font-semibold text-slate-900">{fileLabel}</span>
            {!hasHandle && <span className="ml-1">(not linked to a file on disk yet)</span>}
          </>
        ) : (
          'No file open'
        )}
      </span>
    </div>
  )
}
