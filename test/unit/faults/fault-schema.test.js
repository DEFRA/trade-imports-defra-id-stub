import { describe, test, expect } from 'vitest'
import { faultSchema } from '../../../src/faults/fault-schema.js'

const validate = (body) => faultSchema.validate(body)

describe('faultSchema', () => {
  test('should accept an error fault with no delay and fill in the defaults', () => {
    const { error, value } = validate({ kind: 'error', rate: 0.5, expiresInSeconds: 150 })

    expect(error).toBeUndefined()
    expect(value.status).toBe(503)
    expect(value.retryAfterSeconds).toBe(1)
  })

  test.each(['slow', 'hang'])('should reject a %s fault without a delay', (kind) => {
    expect(validate({ kind, rate: 1, expiresInSeconds: 60 }).error).toBeDefined()
  })

  test('should accept a slow fault with a delay', () => {
    expect(validate({ kind: 'slow', rate: 1, delayMs: 300, expiresInSeconds: 60 }).error).toBeUndefined()
  })

  test('should reject a rate above one', () => {
    expect(validate({ kind: 'error', rate: 1.5, expiresInSeconds: 60 }).error).toBeDefined()
  })

  test('should reject a status that is not a 5xx', () => {
    expect(validate({ kind: 'error', rate: 1, status: 404, expiresInSeconds: 60 }).error).toBeDefined()
  })

  test('should reject an unknown kind', () => {
    expect(validate({ kind: 'melt', rate: 1, expiresInSeconds: 60 }).error).toBeDefined()
  })

  test.each([0, 86_401, undefined])('should reject an expiry of %s', (expiresInSeconds) => {
    expect(validate({ kind: 'error', rate: 1, expiresInSeconds }).error).toBeDefined()
  })
})
