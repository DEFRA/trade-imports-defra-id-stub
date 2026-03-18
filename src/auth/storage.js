import fs from 'node:fs'

export function getStorageDirectory () {
  const directory = '/home/node/keys'

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true })
  }

  return directory
}
