/**
 * The route that reports each integration's latency profile and the latency it answered with.
 *
 * @param {object[]} integrations - the integrations to report
 * @returns {object} a hapi route
 */
export function latencyProfilesRoute (integrations) {
  return {
    method: 'GET',
    path: '/latency-profiles',
    options: {
      tags: ['api']
    },
    handler: (_request, h) => h.response({
      stub: 'trade-imports-defra-id-stub',
      integrations: integrations.map((integration) => integration.report())
    })
  }
}

/**
 * The route that forgets every integration's answered latencies, so the next report covers only
 * what follows.
 *
 * @param {object[]} integrations - the integrations to clear
 * @returns {object} a hapi route
 */
export function clearAnsweredLatenciesRoute (integrations) {
  return {
    method: 'DELETE',
    path: '/latency-profiles/answered',
    options: {
      tags: ['api']
    },
    handler: (_request, h) => {
      integrations.forEach((integration) => integration.clearAnswered())

      return h.response().code(204)
    }
  }
}
