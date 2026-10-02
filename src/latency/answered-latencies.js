/** How many answered latencies are sampled per integration. */
export const DEFAULT_CAPACITY = 10000

const P50 = 0.5
const P95 = 0.95
const P99 = 0.99

const nearestRank = (sorted, quantile) => sorted[Math.max(Math.ceil(quantile * sorted.length) - 1, 0)]

/**
 * Keep a uniform random sample of the answered latencies of one integration since the last clear,
 * using reservoir sampling (Algorithm R), so the percentiles describe the whole window.
 *
 * @param {number} [capacity] - how many answers to keep
 * @param {() => number} [random] - a source of uniform draws in [0, 1)
 * @returns {{ record: (millis: number) => void, clear: () => void, snapshot: () => { count: number, p50Ms: number | null, p95Ms: number | null, p99Ms: number | null } }}
 *   `record` stores one answer; `clear` forgets every answer; `snapshot` reads the number of answers
 *   since the last clear and the nearest-rank percentiles of the sample, null when empty
 */
export function createAnsweredLatencies (capacity = DEFAULT_CAPACITY, random = Math.random) {
  const sample = []
  let total = 0

  return {
    record (millis) {
      total++

      if (total <= capacity) {
        sample.push(millis)
        return
      }

      const slot = Math.floor(random() * total)

      if (slot < capacity) {
        sample[slot] = millis
      }
    },
    clear () {
      sample.length = 0
      total = 0
    },
    snapshot () {
      if (total === 0) {
        return { count: 0, p50Ms: null, p95Ms: null, p99Ms: null }
      }

      const sorted = [...sample].sort((a, b) => a - b)

      return {
        count: total,
        p50Ms: nearestRank(sorted, P50),
        p95Ms: nearestRank(sorted, P95),
        p99Ms: nearestRank(sorted, P99)
      }
    }
  }
}
