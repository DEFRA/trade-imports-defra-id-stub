import { describe, test, expect } from 'vitest'
import { createAnsweredLatencies } from '../../../src/latency/answered-latencies.js'

const fixedClock = (millis) => () => millis

describe('answered latencies', () => {
  test('should report no count, no peak and null percentiles when nothing is recorded', () => {
    expect(createAnsweredLatencies().snapshot()).toEqual({
      count: 0,
      peakPerSecond: 0,
      p50Ms: null,
      p95Ms: null,
      p99Ms: null
    })
  })

  test('should use nearest-rank percentiles when 1 to 100 are recorded', () => {
    const latencies = createAnsweredLatencies(undefined, undefined, fixedClock(1000))

    for (let millis = 1; millis <= 100; millis++) {
      latencies.record(millis)
    }

    expect(latencies.snapshot()).toEqual({ count: 100, peakPerSecond: 100, p50Ms: 50, p95Ms: 95, p99Ms: 99 })
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
    const latencies = createAnsweredLatencies(2, () => draws.shift(), fixedClock(1000))

    for (const millis of [10, 20, 30, 40]) {
      latencies.record(millis)
    }

    expect(latencies.snapshot()).toEqual({ count: 4, peakPerSecond: 4, p50Ms: 20, p95Ms: 30, p99Ms: 30 })
  })

  test('should replace at the last slot inside the capacity and skip at the capacity itself', () => {
    const draws = [0.5, 0.5]
    const latencies = createAnsweredLatencies(2, () => draws.shift(), fixedClock(1000))

    latencies.record(10)
    latencies.record(20)
    latencies.record(30)
    latencies.record(40)

    expect(latencies.snapshot()).toEqual({ count: 4, peakPerSecond: 4, p50Ms: 10, p95Ms: 30, p99Ms: 30 })
  })

  test('should report the busiest second when answers span seconds', () => {
    const clockValues = [1000, 1500, 1999, 2000, 2250, 2500, 2750, 2999, 3000]
    const latencies = createAnsweredLatencies(10, Math.random, () => clockValues.shift())

    for (let answer = 0; answer < 9; answer++) {
      latencies.record(5)
    }

    expect(latencies.snapshot().peakPerSecond).toBe(5)
  })

  test('should empty the snapshot when cleared', () => {
    const latencies = createAnsweredLatencies(3)

    for (const millis of [1, 2, 3, 4, 5]) {
      latencies.record(millis)
    }

    latencies.clear()

    expect(latencies.snapshot()).toEqual({ count: 0, peakPerSecond: 0, p50Ms: null, p95Ms: null, p99Ms: null })
  })

  test('should reset the peak when cleared', () => {
    const latencies = createAnsweredLatencies(10, Math.random, fixedClock(1000))

    for (let answer = 0; answer < 5; answer++) {
      latencies.record(1)
    }

    latencies.clear()
    latencies.record(1)

    expect(latencies.snapshot().peakPerSecond).toBe(1)
  })

  test('should start again after being cleared', () => {
    const latencies = createAnsweredLatencies(3, Math.random, fixedClock(1000))
    latencies.record(5)
    latencies.clear()

    latencies.record(7)

    expect(latencies.snapshot()).toEqual({ count: 1, peakPerSecond: 1, p50Ms: 7, p95Ms: 7, p99Ms: 7 })
  })
})
