import { describe, expect, it } from 'vitest'
import { sortKeyBetween, sortKeyAfterMax } from './sort'

const STEP = 1024

describe('sortKeyBetween', () => {
  it('returns STEP for an empty list (both neighbors absent)', () => {
    expect(sortKeyBetween(null, null)).toBe(STEP)
  })

  it('places before the first item (no prev)', () => {
    expect(sortKeyBetween(null, 100)).toBe(100 - STEP)
    // …and the result sorts before the existing item.
    expect(sortKeyBetween(null, 100)).toBeLessThan(100)
  })

  it('places after the last item (no next)', () => {
    expect(sortKeyBetween(100, null)).toBe(100 + STEP)
    expect(sortKeyBetween(100, null)).toBeGreaterThan(100)
  })

  it('returns the midpoint between two neighbors', () => {
    expect(sortKeyBetween(0, 100)).toBe(50)
    expect(sortKeyBetween(1024, 2048)).toBe(1536)
  })

  it('always returns a value strictly between prev and next', () => {
    const cases: Array<[number, number]> = [
      [0, 1],
      [10, 11],
      [-5, 5],
      [1000.25, 1000.75],
    ]
    for (const [prev, next] of cases) {
      const mid = sortKeyBetween(prev, next)
      expect(mid).toBeGreaterThan(prev)
      expect(mid).toBeLessThan(next)
    }
  })

  it('stays correctly ordered under repeated same-slot bisection', () => {
    // Repeatedly drop an item just above 0, shrinking the slot each time. Every
    // midpoint must stay strictly inside (0, hi) and keep decreasing (no crossing).
    const lo = 0
    let hi = 100
    let prevMid = Number.POSITIVE_INFINITY
    for (let i = 0; i < 20; i++) {
      const mid = sortKeyBetween(lo, hi)
      expect(mid).toBeGreaterThan(lo)
      expect(mid).toBeLessThan(hi)
      expect(mid).toBeLessThan(prevMid)
      prevMid = mid
      hi = mid // next drop goes into the now-smaller [0, mid] slot
    }
  })
})

describe('sortKeyAfterMax', () => {
  it('returns STEP for an empty list', () => {
    expect(sortKeyAfterMax(null)).toBe(STEP)
  })

  it('appends one STEP past the current maximum', () => {
    expect(sortKeyAfterMax(0)).toBe(STEP)
    expect(sortKeyAfterMax(2048)).toBe(2048 + STEP)
  })

  it('always returns a value greater than the current max', () => {
    for (const max of [0, 1, 1024, 999999]) {
      expect(sortKeyAfterMax(max)).toBeGreaterThan(max)
    }
  })
})
