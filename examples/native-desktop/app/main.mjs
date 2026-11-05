import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { app, BrowserWindow, ipcMain, shell } from 'electron'

import { createBackendClient } from './backend-client.mjs'
import { createOidcSession } from './oidc-session.mjs'
import { createTokenStore } from './token-store.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const indexUrl = pathToFileURL(join(here, 'index.html')).href

function required(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Set ${name}. See README.md.`)
  return value
}

const issuer = required('SEAMLESS_ISSUER')
const clientId = required('NATIVE_CLIENT_ID')

const session = createOidcSession({
  issuer,
  clientId,
  resource: required('API_RESOURCE'),
  scopes: required('API_SCOPES').split(' '),
  store: createTokenStore({
    service: 'com.example.desknotes',
    account: `${issuer} ${clientId}`,
  }),
  // The user's default browser: the app never renders the sign-in page itself.
  openBrowser: (url) => shell.openExternal(url),
})
const backend = createBackendClient({ baseUrl: required('BACKEND_URL'), session })

const actions = {
  status: () => session.status(),
  signIn: () => session.signIn(),
  refresh: () => session.refresh(),
  signOut: () => session.signOut(),
  signOutEverywhere: () => session.signOutEverywhere(),
  listNotes: () => backend('GET', '/notes'),
  exportNotes: () => backend('POST', '/notes/export'),
  sendNotice: () => backend('POST', '/account/notice'),
}

// Tokens stay in this process. The renderer only ever sees the results of these actions.
ipcMain.handle('action', async (event, name) => {
  if (event.senderFrame?.url !== indexUrl || !Object.hasOwn(actions, name)) {
    throw new Error('Refused')
  }
  const result = await actions[name]()
  return { result, status: await session.status() }
})

// One process holds the refresh token, so two windows of the app cannot race to rotate it.
if (!app.requestSingleInstanceLock()) app.quit()

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    width: 760,
    height: 620,
    webPreferences: {
      preload: join(here, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
    },
  })
  // The window shows the app's own page and nothing else, so no sign-in page can land in it.
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  window.webContents.on('will-navigate', (event) => event.preventDefault())
  await window.loadFile(join(here, 'index.html'))
  await session.restore().catch((error) => {
    console.error(`Could not restore the session: ${error.message}`)
  })
})

app.on('window-all-closed', () => app.quit())
