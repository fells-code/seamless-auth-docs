// Reads or changes the CLI's keychain entries from outside the CLI.
import { AsyncEntry } from '@napi-rs/keyring'

const [operation, service, account] = process.argv.slice(2)
const entry = (name) =>
  new AsyncEntry(service, `${account} ${name}`, { linux: { store: 'secret-service' } })
if (operation === 'read') {
  process.stdout.write(
    JSON.stringify({
      refresh: await entry('refresh').getPassword(),
      access: await entry('access').getPassword(),
    }),
  )
} else if (operation === 'forget-access') {
  await entry('access')
    .deleteCredential()
    .catch(() => {})
} else if (operation === 'delete') {
  await entry('refresh')
    .deleteCredential()
    .catch(() => {})
  await entry('access')
    .deleteCredential()
    .catch(() => {})
}
process.exit(0)
