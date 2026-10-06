import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest'
import '../helpers/setup-server-mocks.js'

const { createServer } = await import('../../../src/server.js')

const OK = 200
const BAD_REQUEST = 400
const NOT_FOUND = 404
const NO_CONTENT = 204

describe('faults routes', () => {
  let server

  const put = (integration, payload) => server.inject({ method: 'PUT', url: `/faults/${integration}`, payload })

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

  test('should answer the integration report entry when a fault is switched on', async () => {
    const response = await put('defra-id', { kind: 'error', rate: 0.5, status: 503, expiresInSeconds: 150 })

    expect(response.statusCode).toBe(OK)
    expect(response.result.integration).toBe('defra-id')
    expect(response.result.fault).toMatchObject({ kind: 'error', rate: 0.5, status: 503 })
    expect(response.result.injected.error).toBe(0)
  })

  test('should answer not found for an unknown integration', async () => {
    const response = await put('sqs', { kind: 'error', rate: 1, expiresInSeconds: 60 })

    expect(response.statusCode).toBe(NOT_FOUND)
  })

  test('should answer bad request for a rate above one', async () => {
    const response = await put('defra-id', { kind: 'error', rate: 2, expiresInSeconds: 60 })

    expect(response.statusCode).toBe(BAD_REQUEST)
  })

  test('should answer bad request for a path outside the integration', async () => {
    const response = await put('defra-id', { kind: 'error', rate: 1, paths: ['/elsewhere'], expiresInSeconds: 60 })

    expect(response.statusCode).toBe(BAD_REQUEST)
  })

  test('should answer no content when one integration is cleared', async () => {
    await put('defra-id', { kind: 'error', rate: 1, expiresInSeconds: 60 })

    const response = await server.inject({ method: 'DELETE', url: '/faults/defra-id' })

    expect(response.statusCode).toBe(NO_CONTENT)
  })

  test('should answer not found when an unknown integration is cleared', async () => {
    const response = await server.inject({ method: 'DELETE', url: '/faults/sqs' })

    expect(response.statusCode).toBe(NOT_FOUND)
  })

  test('should answer no content when every integration is cleared', async () => {
    const response = await server.inject({ method: 'DELETE', url: '/faults' })

    expect(response.statusCode).toBe(NO_CONTENT)
  })

  test('should list defra-id with every injected kind at zero and no fault', async () => {
    const response = await server.inject({ url: '/faults' })

    expect(response.statusCode).toBe(OK)
    expect(response.result.stub).toBe('trade-imports-defra-id-stub')

    const [defraId] = response.result.integrations

    expect(defraId.integration).toBe('defra-id')
    expect(defraId.paths).toHaveLength(3)
    expect(defraId.fault).toBeNull()
    expect(defraId.injected).toEqual({ slow: 0, hang: 0, reset: 0, throttle: 0, error: 0 })
  })
})
