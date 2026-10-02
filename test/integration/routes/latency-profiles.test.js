import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import '../helpers/setup-server-mocks.js'

const { createServer } = await import('../../../src/server.js')

describe('latency-profiles route', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  test('should report the defra-id profile with its metadata at the defaults', async () => {
    const response = await server.inject({ url: '/latency-profiles' })

    expect(response.statusCode).toBe(200)
    expect(response.result.stub).toBe('trade-imports-defra-id-stub')

    const defraId = response.result.integrations.find(({ integration }) => integration === 'defra-id')

    expect(defraId.profile).toBe('zero-delay')
    expect(defraId.targets).toEqual({ p50Ms: 0, p95Ms: 0, p99Ms: 0 })
    expect(defraId.slaTargets).toEqual({ p50Ms: 100, p95Ms: 400, p99Ms: 1000 })
    expect(defraId.fitted.p95Ms).toBe(470)
    expect(defraId.agreed).toBe(false)
    expect(defraId.lastConformed).toBeNull()
    expect(defraId.owner).toBe('Customer Identity')
  })
})
