import { AsyncEntry } from '@napi-rs/keyring'

const options = { linux: { store: 'secret-service' } }

/**
 * Tokens in the OS credential store: the macOS Keychain, Windows Credential Manager or the Secret
 * Service on Linux. There is deliberately no fallback. If the store is locked or absent, signing in
 * fails and says so. The Linux store is named because the library otherwise falls back to the kernel
 * keyring, which is memory only.
 *
 * Two entries, because Windows caps one credential at about 2.5 KB and a JWT can take most of that.
 * A desktop app can keep its access token in memory. A CLI is a new process for every command, so
 * without this entry every command would spend a refresh.
 */
export function createTokenStore({ service, account }) {
  const refresh = new AsyncEntry(service, `${account} refresh`, options)
  const access = new AsyncEntry(service, `${account} access`, options)
  return {
    getRefresh: () => refresh.getPassword(),
    setRefresh: (token) => refresh.setPassword(token),
    getAccess: async () => JSON.parse((await access.getPassword()) ?? 'null'),
    setAccess: (value) => access.setPassword(JSON.stringify(value)),
    delete: async () => {
      await refresh.deleteCredential()
      await access.deleteCredential()
    },
  }
}
