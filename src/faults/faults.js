/** The five kinds of fault, in the order the report counts them. */
export const FAULT_KINDS = Object.freeze(['slow', 'hang', 'reset', 'throttle', 'error'])

export const DEFAULT_ERROR_STATUS = 503
export const DEFAULT_RETRY_AFTER_SECONDS = 1
const MILLISECONDS_PER_SECOND = 1000

/**
 * Create the fault state of every integration: one active fault each, with request and injection
 * counters that are never reset.
 *
 * @param {{ integration: string, paths: readonly string[] }[]} integrations - the integrations and the paths they answer
 * @param {{ now?: () => number, random?: () => number }} [clock] - the time and random sources, replaceable in tests
 * @returns {{
 *   decide: (path: string) => object | undefined,
 *   apply: (integration: string, spec: object) => object | undefined,
 *   clear: (integration: string) => boolean,
 *   clearAll: () => void,
 *   report: () => { integrations: object[] }
 * }} the fault state
 */
export function createFaults (integrations, { now = Date.now, random = Math.random } = {}) {
  const states = new Map(integrations.map(({ integration, paths }) => [integration, createState(integration, paths)]))
  const byPath = new Map()

  for (const state of states.values()) {
    for (const path of state.paths) {
      byPath.set(path, state)
    }
  }

  return {
    /**
     * Count a request to an integration's path and decide whether to fault it.
     *
     * @param {string} path - the request path
     * @returns {object | undefined} the fault to inject, or undefined to answer normally
     */
    decide (path) {
      const state = byPath.get(path)

      if (!state) {
        return undefined
      }

      state.requests += 1

      const fault = liveFault(state, now())

      if (!fault || !fault.paths.includes(path) || random() >= fault.rate) {
        return undefined
      }

      state.injected[fault.kind] += 1

      return fault
    },

    /**
     * Switch a fault on for an integration, replacing any active one.
     *
     * @param {string} integration - the integration's name
     * @param {object} spec - the validated fault request
     * @returns {object | undefined} the integration's report, or undefined for an unknown integration
     * @throws {Error} when the fault names a path the integration does not answer
     */
    apply (integration, spec) {
      const state = states.get(integration)

      if (!state) {
        return undefined
      }

      const foreign = spec.paths?.find((path) => !state.paths.includes(path))

      if (foreign !== undefined) {
        throw new Error(`Path ${foreign} is not one of ${integration}'s paths`)
      }

      state.fault = buildFault(spec, state.paths, now())

      return reportOf(state, now())
    },

    /**
     * Switch an integration's fault off. The counters are kept.
     *
     * @param {string} integration - the integration's name
     * @returns {boolean} false for an unknown integration
     */
    clear (integration) {
      const state = states.get(integration)

      if (!state) {
        return false
      }

      state.fault = null

      return true
    },

    /** Switch every integration's fault off. */
    clearAll () {
      for (const state of states.values()) {
        state.fault = null
      }
    },

    /**
     * Report every integration's active fault and counters.
     *
     * @returns {{ integrations: object[] }} the report, without the stub's name
     */
    report () {
      const at = now()

      return { integrations: [...states.values()].map((state) => reportOf(state, at)) }
    }
  }
}

function createState (integration, paths) {
  return {
    integration,
    paths: [...paths],
    requests: 0,
    injected: Object.fromEntries(FAULT_KINDS.map((kind) => [kind, 0])),
    fault: null
  }
}

function buildFault (spec, integrationPaths, at) {
  return {
    kind: spec.kind,
    rate: spec.rate,
    delayMs: spec.delayMs ?? 0,
    status: spec.status ?? DEFAULT_ERROR_STATUS,
    retryAfterSeconds: spec.retryAfterSeconds ?? DEFAULT_RETRY_AFTER_SECONDS,
    paths: spec.paths?.length ? [...spec.paths] : [...integrationPaths],
    expiresAt: at + spec.expiresInSeconds * MILLISECONDS_PER_SECOND
  }
}

function liveFault (state, at) {
  if (state.fault && at >= state.fault.expiresAt) {
    state.fault = null
  }

  return state.fault
}

function reportOf (state, at) {
  const fault = liveFault(state, at)

  return {
    integration: state.integration,
    paths: [...state.paths],
    fault: fault ? { ...fault, paths: [...fault.paths], expiresAt: new Date(fault.expiresAt).toISOString() } : null,
    requests: state.requests,
    injected: { ...state.injected }
  }
}
