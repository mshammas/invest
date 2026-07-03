export interface OpenedFile {
  blob: Blob
  handle: FileSystemFileHandle | null
  suggestedName: string
}

export const supportsFileSystemAccess =
  typeof window !== 'undefined' && 'showOpenFilePicker' in window

const PICKER_TYPES = [
  {
    description: 'GoldTrack file',
    accept: { 'application/zip': ['.gtrack'] as `.${string}`[] },
  },
]

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

export async function openPortfolioFile(): Promise<OpenedFile | null> {
  if (supportsFileSystemAccess) {
    try {
      const [handle] = await window.showOpenFilePicker({ types: PICKER_TYPES })
      const blob = await handle.getFile()
      return { blob, handle, suggestedName: handle.name }
    } catch (err) {
      if (isAbortError(err)) return null
      throw err
    }
  }
  return openViaInput()
}

function openViaInput(): Promise<OpenedFile | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.gtrack'
    input.onchange = () => {
      const file = input.files?.[0]
      resolve(file ? { blob: file, handle: null, suggestedName: file.name } : null)
    }
    input.click()
  })
}

export async function saveToHandle(handle: FileSystemFileHandle, blob: Blob): Promise<void> {
  const writable = await handle.createWritable()
  await writable.write(blob)
  await writable.close()
}

/** Prompts for a new location/name (or downloads, on browsers without the File System Access API). */
export async function saveAsPortfolioFile(
  blob: Blob,
  suggestedName: string,
): Promise<FileSystemFileHandle | null> {
  if (supportsFileSystemAccess) {
    try {
      const handle = await window.showSaveFilePicker({ suggestedName, types: PICKER_TYPES })
      await saveToHandle(handle, blob)
      return handle
    } catch (err) {
      if (isAbortError(err)) return null
      throw err
    }
  }
  downloadBlob(blob, suggestedName)
  return null
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
