import { setTimeout as sleep } from 'node:timers/promises'
import { createFaults } from '../faults/faults.js'
import { DEFRA_ID_PATHS } from '../latency/integrations.js'
import { faultRoutes } from '../routes/faults.js'

const TOO_MANY_REQUESTS = 429

/**
 * Drop the connection without an answer, so the caller sees a reset.
 *
 * @param {object} request - the hapi request
 * @param {object} h - the hapi response toolkit
 * @returns {symbol} the signal that the response is abandoned
 */
function dropConnection (request, h) {
  request.raw.req.socket.destroy()

  return h.abandon
}

/**
 * Injects the fault switched on for `defra-id` into requests to its server-to-server paths, after
 * the latency delay. The browser-facing authorize, sign-in and sign-out pages are never faulted.
 */
export const faults = {
  plugin: {
    name: 'faults',
    register (server) {
      const state = createFaults([{ integration: 'defra-id', paths: DEFRA_ID_PATHS }])

      server.ext('onRequest', async (request, h) => {
        const fault = state.decide(withoutTrailingSlash(request.path))

        switch (fault?.kind) {
          case 'slow':
            await sleep(fault.delayMs)
            return h.continue
          case 'hang':
            await sleep(fault.delayMs)
            return dropConnection(request, h)
          case 'reset':
            return dropConnection(request, h)
          case 'throttle':
            return h
              .response({ fault: 'throttle' })
              .code(TOO_MANY_REQUESTS)
              .header('retry-after', String(fault.retryAfterSeconds))
              .takeover()
          case 'error':
            return h.response({ fault: 'error' }).code(fault.status).takeover()
          default:
            return h.continue
        }
      })

      server.route(faultRoutes(state))
    }
  }
}

function withoutTrailingSlash (path) {
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path
}
