import { mkdir, open, rm, stat } from 'node:fs/promises'
import { dirname } from 'node:path'

const POLL_MS = 100
const STALE_MS = 30 * 1000
const WAIT_MS = 45 * 1000

/**
 * One refresher across every process of this CLI on the machine. Refresh tokens rotate and a token
 * used twice revokes the grant, and two commands in a shell pipeline or two terminals are enough to
 * do that. The file holds nothing: only its existence matters, so no token reaches the disk.
 */
export async function withRefreshLock(path, work) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 })
  const deadline = Date.now() + WAIT_MS
  for (;;) {
    try {
      await (await open(path, 'wx', 0o600)).close()
      break
    } catch (error) {
      if (error.code !== 'EEXIST') throw error
    }
    if (Date.now() > deadline) {
      throw new Error(
        `Another command has held ${path} for too long. Delete it if none is running.`,
      )
    }
    // A process that was killed mid-refresh leaves the file behind.
    const held = await stat(path).catch(() => undefined)
    if (held && Date.now() - held.mtimeMs > STALE_MS) await rm(path, { force: true })
    await new Promise((resolve) => setTimeout(resolve, POLL_MS))
  }
  try {
    return await work()
  } finally {
    await rm(path, { force: true })
  }
}
