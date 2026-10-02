import { describe, test, expect } from 'vitest'
import { Z95, Z99, fitLognormal, quantileMs, standardNormal } from '../../../src/latency/lognormal.js'

describe('lognormal', () => {
  describe('fitLognormal', () => {
    test('should match the median exactly and fit the tail to the interim targets', () => {
      const fit = fitLognormal({ p50Ms: 100, p95Ms: 400, p99Ms: 1000 })

      expect(fit.mu).toBeCloseTo(Math.log(100), 4)
      expect(fit.sigma).toBeCloseTo(0.9408, 4)
      expect(quantileMs(fit, 0)).toBe(100)
      expect(quantileMs(fit, Z95)).toBe(470)
      expect(quantileMs(fit, Z99)).toBe(892)
    })

    test('should give a sigma of 0 and a constant delay when all targets are equal', () => {
      const fit = fitLognormal({ p50Ms: 200, p95Ms: 200, p99Ms: 200 })

      expect(fit.sigma).toBe(0)
      expect(quantileMs(fit, -3)).toBe(200)
      expect(quantileMs(fit, 3)).toBe(200)
    })

    test('should throw when the targets are out of order', () => {
      expect(() => fitLognormal({ p50Ms: 100, p95Ms: 50, p99Ms: 1000 })).toThrow(
        'Latency targets must be positive and p50 <= p95 <= p99'
      )
    })

    test('should throw when a target is not positive', () => {
      expect(() => fitLognormal({ p50Ms: 0, p95Ms: 50, p99Ms: 1000 })).toThrow(
        'Latency targets must be positive and p50 <= p95 <= p99'
      )
    })
  })

  describe('standardNormal', () => {
    test('should return the Box-Muller value for fixed uniform draws', () => {
      const draws = [0.2, 0.1]
      const random = () => draws.shift()

      const expected = Math.sqrt(-2 * Math.log(1 - 0.2)) * Math.cos(2 * Math.PI * 0.1)

      expect(standardNormal(random)).toBeCloseTo(expected, 10)
    })

    test('should return a finite value when the first uniform draw is 0', () => {
      const draws = [0, 0.1]
      const random = () => draws.shift()

      expect(Number.isFinite(standardNormal(random))).toBe(true)
    })
  })
})
