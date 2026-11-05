// Reads or deletes the app's keychain entry from outside the app. The e2e runs this with the
// Electron binary, because macOS asks the user before another program reads an item it created.
import { AsyncEntry } from '@napi-rs/keyring'

const [operation, service, account] = process.argv.slice(2)
const entry = new AsyncEntry(service, account, { linux: { store: 'secret-service' } })
if (operation === 'read') {
  process.stdout.write(JSON.stringify({ value: await entry.getPassword() }))
} else if (operation === 'delete') {
  await entry.deleteCredential().catch(() => {})
}
process.exit(0)
