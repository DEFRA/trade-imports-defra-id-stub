import { createAnsweredLatencies } from './answered-latencies.js'
import { Z95, Z99, fitLognormal, quantileMs, standardNormal } from './lognormal.js'
import { JWKS_PATH, TOKEN_PATH, WELL_KNOWN_PATH } from '../routes/open-id.js'

const ZERO_DELAY = 'zero-delay'
const SLA = 'sla'

/**
 * Build the Defra ID integration from the latency configuration.
 *
 * @param {object} latencyConfig - the `latency` configuration block
 * @param {() => number} [gaussian] - a source of standard normal draws
 * @returns {object[]} one integration, `defra-id`, with its paths, profile, metadata, delay and report
 */
export function buildIntegrations (latencyConfig, gaussian = standardNormal) {
  const { defraId } = latencyConfig
  const profile = defraId.profile ?? latencyConfig.profile
  const slaTargets = { p50Ms: defraId.p50Ms, p95Ms: defraId.p95Ms, p99Ms: defraId.p99Ms }
  const fit = fitLognormal(slaTargets)
  const answered = createAnsweredLatencies()

  return [
    {
      integration: 'defra-id',
      paths: [WELL_KNOWN_PATH, TOKEN_PATH, JWKS_PATH],
      profile,
      slaTargets,
      fit,
      answered,
      nextDelayMs () {
        return profile === ZERO_DELAY ? 0 : quantileMs(fit, gaussian())
      },
      clearAnswered () {
        answered.clear()
      },
      report () {
        return {
          integration: 'defra-id',
          interface: defraId.interfaceName,
          owner: defraId.owner,
          serviceLevelSource: defraId.serviceLevelSource,
          agreed: defraId.agreed,
          lastConformed: defraId.lastConformed,
          profile,
          slaTargets,
          fitted: { p50Ms: quantileMs(fit, 0), p95Ms: quantileMs(fit, Z95), p99Ms: quantileMs(fit, Z99) },
          targets: profile === SLA ? slaTargets : { p50Ms: 0, p95Ms: 0, p99Ms: 0 },
          answered: answered.snapshot()
        }
      }
    }
  ]
}

/**
 * Find the integration that answers a request path.
 *
 * @param {object[]} integrations - the integrations
 * @param {string} path - the request path
 * @returns {object | undefined} the integration, or undefined when the path has no profile
 */
export function integrationForPath (integrations, path) {
  const withoutTrailingSlash = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path
  return integrations.find((integration) => integration.paths.includes(withoutTrailingSlash))
}
