import { createResourceServer } from '@seamless-auth/express'
import express from 'express'

import { createNoticeSender } from './notices.mjs'

function required(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Set ${name}. See README.md.`)
  return value
}

const issuer = required('SEAMLESS_ISSUER')
const nativeClientId = required('NATIVE_CLIENT_ID')
const port = Number(process.env.BACKEND_PORT ?? 8787)
const stepUpMaxAge = Number(process.env.STEP_UP_MAX_AGE ?? 300)

const api = createResourceServer({ issuer, audience: required('API_RESOURCE') })
const sendNotice = createNoticeSender({
  issuer,
  apiUrl: required('SEAMLESS_API_URL'),
  backendClientId: required('BACKEND_CLIENT_ID'),
  keyFile: required('BACKEND_KEY_FILE'),
  nativeClientId,
})

// The adapter checks the token. Which clients this API serves is this API's decision (ADR 0002 N3):
// without this, any client allowed the same resource could call it, including the backend itself.
const clients = new Set([nativeClientId])
function requireClient(req, res, next) {
  if (clients.has(req.user.clientId)) return next()
  res.status(403).json({ error: 'client_not_allowed' })
}

const notesByUser = new Map()
const notesOf = (userId) => {
  if (!notesByUser.has(userId)) notesByUser.set(userId, [{ id: 1, text: 'Welcome to Desk Notes' }])
  return notesByUser.get(userId)
}

const app = express()
app.disable('x-powered-by')

app.get('/health', (_req, res) => res.json({ ok: true }))

app.get('/notes', api.requireAuth(), requireClient, api.requireScope('notes:read'), (req, res) => {
  res.json({ notes: notesOf(req.user.id) })
})

// Sensitive, so it needs a phishing-resistant sign-in within the last few minutes. Until the token
// shows one, the guard answers the RFC 9470 challenge, and the app sends the user to the browser.
app.post(
  '/notes/export',
  api.requireAuth(),
  requireClient,
  api.requireScope('notes:read'),
  api.requireStepUp({ acrValues: ['phr'], maxAge: stepUpMaxAge }),
  (req, res) => {
    res.json({
      exported: notesOf(req.user.id),
      signedInWith: { acr: req.user.acr, amr: req.user.amr, authTime: req.user.authTime },
    })
  },
)

app.post(
  '/account/notice',
  api.requireAuth(),
  requireClient,
  api.requireScope('notes:write'),
  async (req, res, next) => {
    try {
      const sent = await sendNotice(req.user.id, {
        subject: 'Your notes export is ready',
        text: 'The export you asked for is ready in the app.',
      })
      res.status(sent.status).json(sent.body)
    } catch (error) {
      next(error)
    }
  },
)

// Express knows an error handler by its four parameters.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(502).json({ error: 'upstream_failed' })
})

app.listen(port, '127.0.0.1', () => {
  console.log(`Backend on http://127.0.0.1:${port}, for ${issuer}`)
})
