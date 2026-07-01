/**
 * Custom window events used to decouple a few sibling components (e.g. the
 * sidebar Search button opening the command palette). Centralized here so the
 * event name is a single typed constant instead of a stringly-typed literal
 * duplicated across files — renaming it in one place can't silently break the
 * other end.
 */
export const OPEN_SEARCH_EVENT = 'wt:open-search'

/** Ask the command palette to open (fired by the sidebar Search button). */
export function openSearch(): void {
  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))
}
