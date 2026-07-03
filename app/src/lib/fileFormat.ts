import JSZip from 'jszip'
import type { Manifest, PortfolioFile } from '../types'

const APP_ID: Manifest['appId'] = 'digital-gold-tracker'
const SCHEMA_VERSION: Manifest['schemaVersion'] = 1

export function createNewPortfolioFile(fileLabel: string, currency = 'INR'): PortfolioFile {
  const now = new Date().toISOString()
  return {
    manifest: {
      appId: APP_ID,
      schemaVersion: SCHEMA_VERSION,
      fileLabel,
      createdAt: now,
      updatedAt: now,
    },
    transactions: [],
    settings: { currency },
  }
}

export async function packPortfolioFile(file: PortfolioFile): Promise<Blob> {
  const zip = new JSZip()
  const updated: PortfolioFile = {
    ...file,
    manifest: { ...file.manifest, updatedAt: new Date().toISOString() },
  }
  zip.file('manifest.json', JSON.stringify(updated.manifest, null, 2))
  zip.file('portfolio.json', JSON.stringify(updated.transactions, null, 2))
  zip.file('settings.json', JSON.stringify(updated.settings, null, 2))
  return zip.generateAsync({ type: 'blob' })
}

export class InvalidPortfolioFileError extends Error {}

export async function unpackPortfolioFile(source: Blob | ArrayBuffer): Promise<PortfolioFile> {
  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(source)
  } catch {
    throw new InvalidPortfolioFileError('This file is not a valid .gtrack file (not a zip archive).')
  }

  const manifestEntry = zip.file('manifest.json')
  const portfolioEntry = zip.file('portfolio.json')
  const settingsEntry = zip.file('settings.json')
  if (!manifestEntry || !portfolioEntry || !settingsEntry) {
    throw new InvalidPortfolioFileError('This file is missing required data and is not a valid .gtrack file.')
  }

  const manifest = JSON.parse(await manifestEntry.async('string')) as Manifest
  if (manifest.appId !== APP_ID) {
    throw new InvalidPortfolioFileError('This file was not created by GoldTrack.')
  }
  if (manifest.schemaVersion > SCHEMA_VERSION) {
    throw new InvalidPortfolioFileError(
      'This file was created by a newer version of GoldTrack. Please update the app.',
    )
  }

  const transactions = JSON.parse(await portfolioEntry.async('string')) as PortfolioFile['transactions']
  const settings = JSON.parse(await settingsEntry.async('string')) as PortfolioFile['settings']

  return { manifest, transactions, settings }
}
