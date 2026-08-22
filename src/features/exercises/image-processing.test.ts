import { describe, expect, it } from 'vitest'
import { fitImageWithinBounds } from './image-processing'

describe('fitImageWithinBounds', () => {
  it('does not enlarge small images', () => {
    expect(fitImageWithinBounds(800, 600)).toEqual({ width: 800, height: 600 })
  })

  it('limits the largest dimension to 1600 pixels', () => {
    expect(fitImageWithinBounds(4_000, 2_000)).toEqual({
      width: 1_600,
      height: 800,
    })
  })

  it('preserves portrait orientation', () => {
    expect(fitImageWithinBounds(1_000, 4_000)).toEqual({
      width: 400,
      height: 1_600,
    })
  })
})
