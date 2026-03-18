import { getPerson } from '../data/people.js'
import { config } from '../config/config.js'

export async function validateCredentials (crn, _password, clientId) {
  if (config.get('loginDisabled')) {
    return false
  }

  const configuredPassword = config.get('auth.password')
  if (!configuredPassword || _password !== configuredPassword) {
    return false
  }

  const person = await getPerson(crn, clientId)

  return !!person
}
