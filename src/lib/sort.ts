/**
 * Fractional ordering helpers. `sort_order` is a float so an item can be moved
 * between two neighbors by picking a value between them — no full renumbering.
 */

const STEP = 1024

/** A new value to place an item between `prev` and `next` (either may be absent). */
export function sortKeyBetween(prev: number | null, next: number | null): number {
  if (prev == null && next == null) return STEP
  if (prev == null) return (next as number) - STEP
  if (next == null) return prev + STEP
  return (prev + next) / 2
}

/** Next value to append after the current maximum. */
export function sortKeyAfterMax(max: number | null): number {
  return max == null ? STEP : max + STEP
}
