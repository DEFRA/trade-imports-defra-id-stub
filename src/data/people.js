import { getData } from './source.js'

export async function getPerson (crn, clientId) {
  const { people } = await getData(clientId)

  return people.find(person => person.crn === crn)
}

export async function getOrganisations (crn, clientId) {
  const { people } = await getData(clientId)

  return people.find(p => p.crn === crn)?.organisations || []
}

export async function getSelectedOrganisation (crn, { sbi, organisationId }, clientId) {
  const { people } = await getData(clientId)
  const person = people.find(p => p.crn === crn)

  if (!person) {
    return null
  }

  if (sbi) {
    return person.organisations.find(org => org.sbi === sbi)
  }

  if (organisationId) {
    return person.organisations.find(org => org.organisationId === organisationId)
  }

  return null
}
