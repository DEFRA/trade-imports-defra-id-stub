import { describe, test, expect } from 'vitest'
import pino from 'pino'
import { loggerOptions } from '../../../../../src/common/helpers/logging/logger-options.js'

const captureLines = () => {
  const lines = []
  return {
    lines,
    stream: { write: (line) => lines.push(JSON.parse(line)) }
  }
}

const logRequest = () => {
  const { lines, stream } = captureLines()
  const logger = pino(
    { level: loggerOptions.level, redact: loggerOptions.redact },
    stream
  )

  const req = {
    method: 'GET',
    url: '/dcidmtest.onmicrosoft.com/oauth2/authresp',
    headers: {
      authorization: 'Bearer CANARY_AUTHORIZATION',
      cookie: 'trade-imports-defra-id-stub-session=CANARY_COOKIE',
      'x-probe': 'CANARY_PROBE'
    },
    query: {
      crn: 'CANARY_CRN',
      password: 'CANARY_PASSWORD',
      code: 'CANARY_QUERY_CODE',
      id_token_hint: 'CANARY_ID_TOKEN_HINT',
      state: 'CANARY_STATE'
    }
  }

  logger.child({ req }).info(
    {
      res: {
        statusCode: 302,
        headers: {
          location: 'http://localhost:3000/auth/sign-in-oidc?code=CANARY_LOCATION_CODE',
          'set-cookie': 'sid=CANARY_SET_COOKIE'
        }
      }
    },
    '[response] get /dcidmtest.onmicrosoft.com/oauth2/authresp 302'
  )

  return lines[0]
}

describe('logger options', () => {
  test('emits request lines at the default level', () => {
    const { lines, stream } = captureLines()

    pino({ level: loggerOptions.level }, stream).info(
      '[response] get /organisations 302'
    )

    expect(lines).toHaveLength(1)
  })

  test('removes credentials carried in request headers', () => {
    const record = logRequest()

    expect(JSON.stringify(record)).not.toContain('CANARY_AUTHORIZATION')
    expect(JSON.stringify(record)).not.toContain('CANARY_COOKIE')
    expect(record.req.headers).toEqual({ 'x-probe': 'CANARY_PROBE' })
  })

  test('removes credentials carried in query parameters', () => {
    const record = logRequest()

    expect(JSON.stringify(record)).not.toContain('CANARY_CRN')
    expect(JSON.stringify(record)).not.toContain('CANARY_PASSWORD')
    expect(JSON.stringify(record)).not.toContain('CANARY_QUERY_CODE')
    expect(JSON.stringify(record)).not.toContain('CANARY_ID_TOKEN_HINT')
    expect(record.req.query).toEqual({ state: 'CANARY_STATE' })
  })

  test('removes response headers so the authorization code never reaches the log', () => {
    const record = logRequest()

    expect(JSON.stringify(record)).not.toContain('CANARY_LOCATION_CODE')
    expect(JSON.stringify(record)).not.toContain('CANARY_SET_COOKIE')
    expect(record.res).toEqual({ statusCode: 302 })
  })

  test('keeps the request path and method for tracing', () => {
    const record = logRequest()

    expect(record.req.method).toBe('GET')
    expect(record.req.url).toBe('/dcidmtest.onmicrosoft.com/oauth2/authresp')
  })

  test('removes credentials carried in request payloads', () => {
    const { lines, stream } = captureLines()

    pino(
      { level: loggerOptions.level, redact: loggerOptions.redact },
      stream
    ).info({
      payload: {
        grant_type: 'authorization_code',
        crn: 'CANARY_PAYLOAD_CRN',
        password: 'CANARY_PAYLOAD_PASSWORD',
        client_secret: 'CANARY_CLIENT_SECRET',
        code: 'CANARY_PAYLOAD_CODE',
        refresh_token: 'CANARY_REFRESH_TOKEN'
      }
    })

    expect(lines[0].payload).toEqual({ grant_type: 'authorization_code' })
  })
})
