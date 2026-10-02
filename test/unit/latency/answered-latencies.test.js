import { describe, test, expect } from 'vitest'
import { createAnsweredLatencies } from '../../../src/latency/answered-latencies.js'

describe('answered latencies', () => {
  test('should report no count and null percentiles when nothing is recorded', () => {
    expect(createAnsweredLatencies().snapshot()).toEqual({ count: 0, p50Ms: null, p95Ms: null, p99Ms: null })
  })

  test('should use nearest-rank percentiles when 1 to 100 are recorded', () => {
    const latencies = createAnsweredLatencies()

    for (let millis = 1; millis <= 100; millis++) {
      latencies.record(millis)
    }

    expect(latencies.snapshot()).toEqual({ count: 100, p50Ms: 50, p95Ms: 95, p99Ms: 99 })
  })

  test('should count every answer and cover the whole range when twice the capacity is recorded', () => {
    const capacity = 1000
    let seed = 42
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296
      return seed / 4294967296
    }
    const latencies = createAnsweredLatencies(capacity, random)

    for (let millis = 1; millis <= 2 * capacity; millis++) {
      latencies.record(millis)
    }

    const snapshot = latencies.snapshot()

    expect(snapshot.count).toBe(2 * capacity)
    expect(snapshot.p50Ms).toBeGreaterThan(800)
    expect(snapshot.p50Ms).toBeLessThan(1200)
    expect(snapshot.p95Ms).toBeGreaterThan(1800)
    expect(snapshot.p99Ms).toBeGreaterThan(1900)
  })

  test('should replace a sampled answer only when the random slot falls inside the capacity', () => {
    const draws = [0, 0.99]
    const latencies = createAnsweredLatencies(2, () => draws.shift())

    for (const millis of [10, 20, 30, 40]) {
      latencies.record(millis)
    }

    expect(latencies.snapshot()).toEqual({ count: 4, p50Ms: 20, p95Ms: 30, p99Ms: 30 })
  })

  test('should empty the snapshot when cleared', () => {
    const latencies = createAnsweredLatencies(3)

    for (const millis of [1, 2, 3, 4, 5]) {
      latencies.record(millis)
    }

    latencies.clear()

    expect(latencies.snapshot()).toEqual({ count: 0, p50Ms: null, p95Ms: null, p99Ms: null })
  })

  test('should start again after being cleared', () => {
    const latencies = createAnsweredLatencies(3)
    latencies.record(5)
    latencies.clear()

    latencies.record(7)

    expect(latencies.snapshot()).toEqual({ count: 1, p50Ms: 7, p95Ms: 7, p99Ms: 7 })
  })
})
