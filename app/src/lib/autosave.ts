import { get, set, del } from 'idb-keyval'
import type { PortfolioFile } from '../types'

const DRAFT_KEY = 'goldtrack-draft'

/** Crash-recovery only — never a substitute for an explicit Save to a .gtrack file. */
export function saveDraft(file: PortfolioFile): Promise<void> {
  return set(DRAFT_KEY, file)
}

export function loadDraft(): Promise<PortfolioFile | undefined> {
  return get(DRAFT_KEY)
}

export function clearDraft(): Promise<void> {
  return del(DRAFT_KEY)
}
