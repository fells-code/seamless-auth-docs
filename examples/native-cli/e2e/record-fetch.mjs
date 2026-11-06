// Loaded into the CLI by the e2e with `node --import`, so the CLI itself has no test code. Records
// what it sends, one JSON line per request, to the file the e2e names.
import { appendFileSync } from 'node:fs'

const realFetch = globalThis.fetch
globalThis.fetch = async (input, init = {}) => {
  const request = new Request(input, init)
  const response = await realFetch(input, init)
  appendFileSync(
    process.env.E2E_TRAFFIC_FILE,
    `${JSON.stringify({
      at: Date.now(),
      url: request.url,
      method: request.method,
      body: init.body ? String(init.body) : '',
      authorization: request.headers.get('authorization'),
      status: response.status,
    })}\n`,
  )
  return response
}
