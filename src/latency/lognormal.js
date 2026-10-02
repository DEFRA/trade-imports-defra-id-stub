/** The standard normal quantile at the 95th percentile. */
export const Z95 = 1.6448536269514722

/** The standard normal quantile at the 99th percentile. */
export const Z99 = 2.3263478740408408

/**
 * Fit a lognormal distribution to service-level targets. The median is matched exactly
 * (mu = ln p50) and sigma is the least-squares fit to the p95 and p99 targets in log space.
 *
 * @param {{ p50Ms: number, p95Ms: number, p99Ms: number }} targets - the latency targets in milliseconds
 * @returns {{ mu: number, sigma: number }} the fitted distribution
 * @throws {Error} when a target is not positive or the targets are out of order
 */
export function fitLognormal ({ p50Ms, p95Ms, p99Ms }) {
  if (!(p50Ms > 0 && p50Ms <= p95Ms && p95Ms <= p99Ms)) {
    throw new Error('Latency targets must be positive and p50 <= p95 <= p99')
  }

  const mu = Math.log(p50Ms)
  const sigma = (Z95 * Math.log(p95Ms / p50Ms) + Z99 * Math.log(p99Ms / p50Ms)) / (Z95 * Z95 + Z99 * Z99)

  return { mu, sigma }
}

/**
 * The value of a fitted distribution at a standard normal quantile.
 *
 * @param {{ mu: number, sigma: number }} fit - the fitted distribution
 * @param {number} z - a draw from the standard normal distribution
 * @returns {number} the latency in whole milliseconds
 */
export function quantileMs (fit, z) {
  return Math.round(Math.exp(fit.mu + fit.sigma * z))
}

/**
 * Draw from the standard normal distribution using the Box-Muller transform.
 *
 * @param {() => number} [random] - a source of uniform draws in [0, 1)
 * @returns {number} a standard normal draw
 */
export function standardNormal (random = Math.random) {
  return Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random())
}
