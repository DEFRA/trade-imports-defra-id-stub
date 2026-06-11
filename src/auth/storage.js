import fs from 'node:fs'

import { config } from '../config/config.js'

export function getStorageDirectory () {
  const directory = config.get('auth.keysDirectory')

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true })
  }

  return directory
}
