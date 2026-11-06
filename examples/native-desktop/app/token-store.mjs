import { AsyncEntry } from '@napi-rs/keyring'

/**
 * The refresh token in the OS credential store: the macOS Keychain, Windows Credential Manager or
 * the Secret Service on Linux. There is deliberately no fallback. If the store is locked or absent,
 * signing in fails and says so. The Linux store is named because the library otherwise falls back
 * to the kernel keyring, which is memory only, so the user would be signed out at every reboot.
 */
export function createTokenStore({ service, account }) {
  const entry = new AsyncEntry(service, account, { linux: { store: 'secret-service' } })
  return {
    get: () => entry.getPassword(),
    set: (token) => entry.setPassword(token),
    delete: () => entry.deleteCredential(),
  }
}
