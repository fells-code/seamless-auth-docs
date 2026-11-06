import { spawn } from 'node:child_process'

function browserCommand(url) {
  const override = process.env.BROWSER?.trim()
  if (override) return [override, [url]]
  if (process.platform === 'darwin') return ['open', [url]]
  // Not `cmd /c start`: cmd would parse the & in the query string.
  if (process.platform === 'win32') return ['rundll32', ['url.dll,FileProtocolHandler', url]]
  return ['xdg-open', [url]]
}

/** Best effort. The caller has already printed the URL, which covers a machine with no browser. */
export function openBrowser(url) {
  const [command, args] = browserCommand(url)
  const child = spawn(command, args, { stdio: 'ignore', detached: true })
  child.once('error', () => {})
  child.unref()
}
