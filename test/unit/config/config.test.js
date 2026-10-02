import { describe, test, expect, afterEach } from 'vitest'
import { config } from '../../../src/config/config.js'

const lastConformedKey = 'latency.defraId.lastConformed'

describe('config latency.defraId.lastConformed', () => {
  afterEach(() => {
    config.set(lastConformedKey, config.default(lastConformedKey))
  })

  test.each(['2026-99-99', '2026-02-30', '2026-9-29', '29/09/2026'])(
    'should reject %s',
    (value) => {
      config.set(lastConformedKey, value)

      expect(() => config.validate({ allowed: 'strict' })).toThrow('Must be null or a date in format "YYYY-MM-DD"')
    }
  )

  test('should accept a real date', () => {
    config.set(lastConformedKey, '2026-09-29')

    expect(() => config.validate({ allowed: 'strict' })).not.toThrow()
  })

  test('should accept the unset default', () => {
    expect(() => config.validate({ allowed: 'strict' })).not.toThrow()
  })
})
