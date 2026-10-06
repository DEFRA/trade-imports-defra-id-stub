import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest'
import '../helpers/setup-server-mocks.js'
import { config } from '../../../src/config/config.js'
import { JWKS_PATH, TOKEN_PATH } from '../../../src/routes/open-id.js'

const { createServer } = await import('../../../src/server.js')

const delayMs = 50
const hangDelayMs = 300
const SERVICE_UNAVAILABLE = 503
const TOO_MANY_REQUESTS = 429
const authorizeQuery = {
  serviceId: '11111111-1111-1111-1111-111111111111',
  client_id: '00000000-0000-0000-0000-000000000000',
  redirect_uri: 'https://example.com/callback',
  scope: 'openid'
}
const authorizePath = '/dcidmtest.onmicrosoft.com/b2c_1a_cui_cpdev_signupsigninsfi/oauth2/v2.0/authorize'

describe('faults plugin', () => {
  let server

  const switchOn = async (spec) => {
    const response = await server.inject({ method: 'PUT', url: '/faults/defra-id', payload: spec })

    expect(response.statusCode).toBe(200)
  }

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.inject({ method: 'DELETE', url: '/faults' })
  })

  afterAll(async () => {
    await server.stop()
  })

  test('should answer an error fault with its status instead of the real answer', async () => {
    await switchOn({ kind: 'error', rate: 1, status: SERVICE_UNAVAILABLE, expiresInSeconds: 60 })

    const response = await server.inject({ method: 'POST', url: TOKEN_PATH })

    expect(response.statusCode).toBe(SERVICE_UNAVAILABLE)
  })

  test('should answer a throttle fault with 429 and retry-after', async () => {
    await switchOn({ kind: 'throttle', rate: 1, retryAfterSeconds: 5, expiresInSeconds: 60 })

    const response = await server.inject({ url: JWKS_PATH })

    expect(response.statusCode).toBe(TOO_MANY_REQUESTS)
    expect(response.headers['retry-after']).toBe('5')
  })

  test('should delay a slow fault and then answer normally', async () => {
    await switchOn({ kind: 'slow', rate: 1, delayMs, expiresInSeconds: 60 })

    const startedAt = performance.now()
    const response = await server.inject({ url: JWKS_PATH })

    expect(performance.now() - startedAt).toBeGreaterThanOrEqual(delayMs - 1)
    expect(response.statusCode).toBe(200)
    expect(response.result.keys).toBeDefined()
  })

  test('should answer normally once the fault is cleared', async () => {
    await switchOn({ kind: 'error', rate: 1, expiresInSeconds: 60 })
    await server.inject({ method: 'DELETE', url: '/faults/defra-id' })

    const response = await server.inject({ url: JWKS_PATH })

    expect(response.statusCode).toBe(200)
  })

  test('should never fault the browser-facing authorize page', async () => {
    await switchOn({ kind: 'error', rate: 1, expiresInSeconds: 60 })

    const response = await server.inject({ url: `${authorizePath}?${new URLSearchParams(authorizeQuery).toString()}` })

    expect(response.statusCode).toBe(302)
  })

  test('should count each request and injection', async () => {
    const readDefraId = async () => {
      const report = await server.inject({ url: '/faults' })

      return report.result.integrations.find(({ integration }) => integration === 'defra-id')
    }

    await switchOn({ kind: 'error', rate: 1, expiresInSeconds: 60 })
    const before = await readDefraId()

    await server.inject({ url: JWKS_PATH })
    const after = await readDefraId()

    expect(after.requests).toBe(before.requests + 1)
    expect(after.injected.error).toBe(before.injected.error + 1)
  })

  test('should fault only the paths the fault names', async () => {
    await switchOn({ kind: 'error', rate: 1, status: SERVICE_UNAVAILABLE, paths: [JWKS_PATH], expiresInSeconds: 60 })

    const faulted = await server.inject({ url: JWKS_PATH })
    const untouched = await server.inject({ method: 'POST', url: TOKEN_PATH })

    expect(faulted.statusCode).toBe(SERVICE_UNAVAILABLE)
    expect(untouched.statusCode).not.toBe(SERVICE_UNAVAILABLE)
    expect(untouched.result?.fault).toBeUndefined()
  })

  test('should fault a path requested with a trailing slash', async () => {
    await switchOn({ kind: 'error', rate: 1, status: SERVICE_UNAVAILABLE, paths: [TOKEN_PATH], expiresInSeconds: 60 })

    const response = await server.inject({ method: 'POST', url: `${TOKEN_PATH}/` })

    expect(response.statusCode).toBe(SERVICE_UNAVAILABLE)
  })
})

describe('faults plugin on a listening server', () => {
  let server
  let baseUrl

  beforeAll(async () => {
    config.set('port', 0)
    server = await createServer()
    await server.start()
    baseUrl = server.info.uri
  })

  afterEach(async () => {
    await server.inject({ method: 'DELETE', url: '/faults' })
  })

  afterAll(async () => {
    await server.stop()
    config.set('port', config.default('port'))
  })

  test('should drop the connection straight away for a reset fault', async () => {
    await server.inject({
      method: 'PUT',
      url: '/faults/defra-id',
      payload: { kind: 'reset', rate: 1, expiresInSeconds: 60 }
    })

    const startedAt = Date.now()

    await expect(fetch(`${baseUrl}${JWKS_PATH}`)).rejects.toThrow()
    expect(Date.now() - startedAt).toBeLessThan(hangDelayMs)
  })

  test('should hold the request for the delay and then drop the connection for a hang fault', async () => {
    await server.inject({
      method: 'PUT',
      url: '/faults/defra-id',
      payload: { kind: 'hang', rate: 1, delayMs: hangDelayMs, expiresInSeconds: 60 }
    })

    const startedAt = Date.now()

    await expect(fetch(`${baseUrl}${JWKS_PATH}`)).rejects.toThrow()
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(hangDelayMs)
  })
})
