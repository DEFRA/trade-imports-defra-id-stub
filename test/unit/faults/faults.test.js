import { describe, test, expect } from 'vitest'
import { createFaults, FAULT_KINDS } from '../../../src/faults/faults.js'

const TOKEN = '/token'
const KEYS = '/keys'
const NOW = Date.parse('2026-10-06T12:00:00Z')

const integrations = [{ integration: 'defra-id', paths: [TOKEN, KEYS] }]

const errorFault = (overrides = {}) => ({ kind: 'error', rate: 1, expiresInSeconds: 60, ...overrides })

const faultsWith = ({ draws = [0], at = () => NOW } = {}) => {
  const queue = [...draws]
  const random = () => (queue.length > 1 ? queue.shift() : queue[0])

  return createFaults(integrations, { now: at, random })
}

describe('createFaults', () => {
  test('should inject an error fault at rate one and count the request and the injection', () => {
    const faults = faultsWith()
    faults.apply('defra-id', errorFault())

    expect(faults.decide(TOKEN)).toMatchObject({ kind: 'error', status: 503 })

    const [defraId] = faults.report().integrations

    expect(defraId.requests).toBe(1)
    expect(defraId.injected.error).toBe(1)
    expect(defraId.injected.slow).toBe(0)
  })

  test('should inject once in two at rate half with draws below and above it', () => {
    const faults = faultsWith({ draws: [0.4, 0.6] })
    faults.apply('defra-id', errorFault({ rate: 0.5 }))

    expect(faults.decide(TOKEN)).toBeDefined()
    expect(faults.decide(TOKEN)).toBeUndefined()

    const [defraId] = faults.report().integrations

    expect(defraId.requests).toBe(2)
    expect(defraId.injected.error).toBe(1)
  })

  test('should leave a path outside the fault paths alone', () => {
    const faults = faultsWith()
    faults.apply('defra-id', errorFault({ paths: [KEYS] }))

    expect(faults.decide(TOKEN)).toBeUndefined()
    expect(faults.decide(KEYS)).toBeDefined()
    expect(faults.report().integrations[0].requests).toBe(2)
  })

  test('should stop applying and report no fault once the fault has expired', () => {
    let at = NOW
    const faults = faultsWith({ at: () => at })
    faults.apply('defra-id', errorFault())

    expect(faults.decide(TOKEN)).toBeDefined()

    at = NOW + 61_000

    expect(faults.decide(TOKEN)).toBeUndefined()
    expect(faults.report().integrations[0].fault).toBeNull()
  })

  test('should switch the fault off on clear and keep the counters', () => {
    const faults = faultsWith()
    faults.apply('defra-id', errorFault())
    faults.decide(TOKEN)

    expect(faults.clear('defra-id')).toBe(true)
    expect(faults.decide(TOKEN)).toBeUndefined()

    const [defraId] = faults.report().integrations

    expect(defraId.fault).toBeNull()
    expect(defraId.requests).toBe(2)
    expect(defraId.injected.error).toBe(1)
  })

  test('should switch every fault off on clearAll', () => {
    const faults = faultsWith()
    faults.apply('defra-id', errorFault())

    faults.clearAll()

    expect(faults.report().integrations[0].fault).toBeNull()
  })

  test('should neither count nor fault a path that is not an integration path', () => {
    const faults = faultsWith()
    faults.apply('defra-id', errorFault())

    expect(faults.decide('/health')).toBeUndefined()
    expect(faults.decide('/latency-profiles')).toBeUndefined()
    expect(faults.decide('/faults')).toBeUndefined()
    expect(faults.report().integrations[0].requests).toBe(0)
  })

  test('should return undefined for an unknown integration on apply and false on clear', () => {
    const faults = faultsWith()

    expect(faults.apply('sqs', errorFault())).toBeUndefined()
    expect(faults.clear('sqs')).toBe(false)
  })

  test('should throw for a path outside the integration', () => {
    const faults = faultsWith()

    expect(() => faults.apply('defra-id', errorFault({ paths: ['/elsewhere'] }))).toThrow(
      "Path /elsewhere is not one of defra-id's paths"
    )
  })

  test('should report every kind counted, in order, and default the status and retry-after', () => {
    const faults = faultsWith()

    const report = faults.apply('defra-id', errorFault())

    expect(Object.keys(faults.report().integrations[0].injected)).toEqual(FAULT_KINDS)
    expect(report.fault).toMatchObject({ status: 503, retryAfterSeconds: 1, paths: [TOKEN, KEYS] })
    expect(report.fault.expiresAt).toBe('2026-10-06T12:01:00.000Z')
  })
})
