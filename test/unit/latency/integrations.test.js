import { describe, test, expect } from 'vitest'
import { Z95 } from '../../../src/latency/lognormal.js'
import { buildIntegrations, integrationForPath } from '../../../src/latency/integrations.js'
import { JWKS_PATH, TOKEN_PATH, WELL_KNOWN_PATH } from '../../../src/routes/open-id.js'

const latencyConfig = (overrides = {}) => ({
  profile: 'zero-delay',
  defraId: {
    profile: null,
    interfaceName: 'Defra Identity OIDC discovery, token and signing keys',
    owner: 'Customer Identity',
    serviceLevelSource: 'Interim (c-011 default): §9.5 IDM latency is TBC',
    agreed: false,
    lastConformed: null,
    p50Ms: 100,
    p95Ms: 400,
    p99Ms: 1000,
    ...overrides
  }
})

describe('integrations', () => {
  describe('buildIntegrations', () => {
    test('should run defra-id on the stub-wide profile when its own is not set', () => {
      const [integration] = buildIntegrations(latencyConfig())

      expect(integration.integration).toBe('defra-id')
      expect(integration.profile).toBe('zero-delay')
      expect(integration.paths).toEqual([WELL_KNOWN_PATH, TOKEN_PATH, JWKS_PATH])
    })

    test('should let the defra-id profile override the stub-wide profile', () => {
      const [integration] = buildIntegrations(latencyConfig({ profile: 'sla' }))

      expect(integration.profile).toBe('sla')
    })

    test('should let a defra-id zero-delay profile override a stub-wide sla profile', () => {
      const config = { ...latencyConfig({ profile: 'zero-delay' }), profile: 'sla' }
      const [integration] = buildIntegrations(config, () => 5)

      expect(integration.profile).toBe('zero-delay')
      expect(integration.nextDelayMs()).toBe(0)
    })

    test('should report the sla targets and the fitted percentiles under a stub-wide sla profile', () => {
      const config = { ...latencyConfig(), profile: 'sla' }
      const [integration] = buildIntegrations(config)
      const report = integration.report()

      expect(report.profile).toBe('sla')
      expect(report.targets).toEqual(report.slaTargets)
      expect(report.targets).toEqual({ p50Ms: 100, p95Ms: 400, p99Ms: 1000 })
      expect(report.fitted.p95Ms).toBe(470)
    })

    test('should add no delay under zero-delay', () => {
      const [integration] = buildIntegrations(latencyConfig(), () => 5)

      expect(integration.nextDelayMs()).toBe(0)
    })

    test('should add the fitted delay under sla', () => {
      const [integration] = buildIntegrations(latencyConfig({ profile: 'sla' }), () => Z95)

      expect(integration.nextDelayMs()).toBe(470)
    })

    test('should report exactly the fields the Java stub reports', () => {
      const [integration] = buildIntegrations(latencyConfig())

      expect(Object.keys(integration.report())).toEqual([
        'integration',
        'interface',
        'owner',
        'serviceLevelSource',
        'agreed',
        'lastConformed',
        'profile',
        'slaTargets',
        'fitted',
        'targets',
        'answered'
      ])
    })
  })

  describe('integrationForPath', () => {
    const integrations = buildIntegrations(latencyConfig())

    test('should find the token path with and without a trailing slash', () => {
      expect(integrationForPath(integrations, TOKEN_PATH)?.integration).toBe('defra-id')
      expect(integrationForPath(integrations, `${TOKEN_PATH}/`)?.integration).toBe('defra-id')
    })

    test('should find nothing for the authorize path', () => {
      const authorizePath = '/dcidmtest.onmicrosoft.com/b2c_1a_cui_cpdev_signupsigninsfi/oauth2/v2.0/authorize'

      expect(integrationForPath(integrations, authorizePath)).toBeUndefined()
    })
  })
})
