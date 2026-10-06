import Boom from '@hapi/boom'
import Joi from 'joi'
import { faultSchema } from '../faults/fault-schema.js'

const STUB_NAME = 'trade-imports-defra-id-stub'
const INTEGRATION_NAME = /^[a-z-]{1,40}$/
const NO_CONTENT = 204

/**
 * The routes that switch faults on and off and report what was injected: the same contract
 * `trade-imports-stub` serves.
 *
 * @param {object} faults - the fault state from `createFaults`
 * @returns {object[]} four hapi routes
 */
export function faultRoutes (faults) {
  const integrationParams = Joi.object({ integration: Joi.string().pattern(INTEGRATION_NAME) })

  return [
    {
      method: 'GET',
      path: '/faults',
      options: { tags: ['api'] },
      handler: (_request, h) => h.response({ stub: STUB_NAME, ...faults.report() })
    },
    {
      method: 'PUT',
      path: '/faults/{integration}',
      options: {
        tags: ['api'],
        validate: { params: integrationParams, payload: faultSchema }
      },
      handler: (request, h) => {
        const { integration } = request.params

        try {
          const report = faults.apply(integration, request.payload)

          return report ? h.response(report) : Boom.notFound(`No integration named ${integration}`)
        } catch (error) {
          return Boom.badRequest(error.message)
        }
      }
    },
    {
      method: 'DELETE',
      path: '/faults/{integration}',
      options: {
        tags: ['api'],
        validate: { params: integrationParams }
      },
      handler: (request, h) => {
        const { integration } = request.params

        return faults.clear(integration)
          ? h.response().code(NO_CONTENT)
          : Boom.notFound(`No integration named ${integration}`)
      }
    },
    {
      method: 'DELETE',
      path: '/faults',
      options: { tags: ['api'] },
      handler: (_request, h) => {
        faults.clearAll()

        return h.response().code(NO_CONTENT)
      }
    }
  ]
}
