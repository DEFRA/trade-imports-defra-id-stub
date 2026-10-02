import { setTimeout as sleep } from 'node:timers/promises'
import { config } from '../config/config.js'
import { buildIntegrations, integrationForPath } from '../latency/integrations.js'
import { clearAnsweredLatenciesRoute, latencyProfilesRoute } from '../routes/latency-profiles.js'

/**
 * Delays requests to a profiled integration by a draw from its latency profile and records how long
 * the stub took to answer. Requests to any other path are untouched.
 */
export const latency = {
  plugin: {
    name: 'latency',
    register (server) {
      const integrations = buildIntegrations(config.get('latency'))

      server.ext('onRequest', async (request, h) => {
        const integration = integrationForPath(integrations, request.path)

        if (!integration) {
          return h.continue
        }

        request.plugins.latency = { integration, startedAt: performance.now() }

        const delay = integration.nextDelayMs()

        if (delay > 0) {
          await sleep(delay)
        }

        return h.continue
      })

      server.ext('onPreResponse', (request, h) => {
        const measured = request.plugins.latency

        if (measured) {
          measured.integration.answered.record(Math.round(performance.now() - measured.startedAt))
        }

        return h.continue
      })

      server.route([latencyProfilesRoute(integrations), clearAnsweredLatenciesRoute(integrations)])
    }
  }
}
