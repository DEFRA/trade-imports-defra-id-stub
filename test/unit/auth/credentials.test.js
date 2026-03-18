import { vi, describe, beforeEach, test, expect } from 'vitest'

vi.mock('../../../src/data/people.js', () => ({
  getPerson: vi.fn()
}))
vi.mock('../../../src/config/config.js')

const { getPerson } = await import('../../../src/data/people.js')
const { config } = await import('../../../src/config/config.js')

const { validateCredentials } = await import('../../../src/auth/credentials.js')

const crn = 1234567890
const password = 'Password123'
const clientId = '00000000-0000-0000-0000-000000000000'

describe('validateCredentials', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    config.get.mockImplementation((key) => {
      if (key === 'loginDisabled') {
        return false
      }
      if (key === 'auth.password') {
        return password
      }
      return undefined
    })
    getPerson.mockResolvedValue({ crn, firstName: 'John', lastName: 'Doe' })
  })

  test('should check if person exists for given CRN and clientId', async () => {
    await validateCredentials(crn, password, clientId)
    expect(getPerson).toHaveBeenCalledTimes(1)
    expect(getPerson).toHaveBeenCalledWith(crn, clientId)
  })

  test('should return true if CRN exists', async () => {
    const result = await validateCredentials(crn, password, clientId)
    expect(result).toBe(true)
  })

  test('should return false if CRN does not exist', async () => {
    getPerson.mockResolvedValue(null)

    const result = await validateCredentials('invalid-crn', password, clientId)
    expect(result).toBe(false)
  })

  test('should return false if login is disabled', async () => {
    config.get.mockImplementation((key) => {
      if (key === 'loginDisabled') {
        return true
      }
      if (key === 'auth.password') {
        return password
      }
      return undefined
    })

    const result = await validateCredentials(crn, password, clientId)
    expect(result).toBe(false)
    expect(getPerson).not.toHaveBeenCalled()
  })
})
