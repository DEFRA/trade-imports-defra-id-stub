import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import '../helpers/setup-server-mocks.js'
import { config } from '../../../src/config/config.js'
import { JWKS_PATH } from '../../../src/routes/open-id.js'

const { createServer } = await import('../../../src/server.js')

const targetMs = 50
const authorizeQuery = {
  serviceId: '11111111-1111-1111-1111-111111111111',
  client_id: '00000000-0000-0000-0000-000000000000',
  redirect_uri: 'https://example.com/callback',
  scope: 'openid'
}
const authorizePath = '/dcidmtest.onmicrosoft.com/b2c_1a_cui_cpdev_signupsigninsfi/oauth2/v2.0/authorize'

describe('latency plugin', () => {
  let server

  const defraId = async () => {
    const response = await server.inject({ url: '/latency-profiles' })
    return { response, integration: response.result.integrations.find(({ integration }) => integration === 'defra-id') }
  }

  beforeAll(async () => {
    config.set('latency.profile', 'sla')
    config.set('latency.defraId.p50Ms', targetMs)
    config.set('latency.defraId.p95Ms', targetMs)
    config.set('latency.defraId.p99Ms', targetMs)

    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
    config.set('latency.profile', config.default('latency.profile'))
    config.set('latency.defraId.p50Ms', config.default('latency.defraId.p50Ms'))
    config.set('latency.defraId.p95Ms', config.default('latency.defraId.p95Ms'))
    config.set('latency.defraId.p99Ms', config.default('latency.defraId.p99Ms'))
  })

  test('should delay a profiled request by the sla profile and report what it answered', async () => {
    const startedAt = performance.now()
    await server.inject({ url: JWKS_PATH })
    const elapsedMs = performance.now() - startedAt

    expect(elapsedMs).toBeGreaterThanOrEqual(targetMs - 1)

    const { response, integration } = await defraId()

    expect(response.statusCode).toBe(200)
    expect(response.result.stub).toBe('trade-imports-defra-id-stub')
    expect(integration.profile).toBe('sla')
    expect(integration.answered.count).toBeGreaterThanOrEqual(1)
    expect(integration.answered.peakPerSecond).toBeGreaterThanOrEqual(1)
    expect(integration.answered.p50Ms).toBeGreaterThanOrEqual(targetMs - 1)
  })

  test('should forget what it answered when the answered latencies are cleared', async () => {
    await server.inject({ url: JWKS_PATH })

    const cleared = await server.inject({ method: 'DELETE', url: '/latency-profiles/answered' })
    const { integration } = await defraId()

    expect(cleared.statusCode).toBe(204)
    expect(integration.answered).toEqual({ count: 0, peakPerSecond: 0, p50Ms: null, p95Ms: null, p99Ms: null })
  })

  test('should not count a browser-facing request', async () => {
    const { integration: before } = await defraId()

    const authorize = await server.inject({ url: `${authorizePath}?${new URLSearchParams(authorizeQuery).toString()}` })

    const { integration: after } = await defraId()

    expect(authorize.statusCode).toBe(302)
    expect(after.answered.count).toBe(before.answered.count)

    await server.inject({ url: JWKS_PATH })

    const { integration: afterProfiled } = await defraId()

    expect(afterProfiled.answered.count).toBe(before.answered.count + 1)
  })
})
