import { Mutex } from 'async-mutex'
import { Sandbox } from './'
import { isNil } from '@activepieces/shared'

const SANDBOX_LIMIT = 1000

const sandboxes: Sandbox[] = new Array(SANDBOX_LIMIT).fill(null).map((_, i) => new Sandbox({
    boxId: i,
    cached: false,
    used: false,
    key: null,
    lastUsed: 0,
}))

const lock: Mutex = new Mutex()

export const sandboxManager = {
    async obtainSandbox(key: string): Promise<Sandbox> {
        const releaseLock = await lock.acquire()
        const sandbox = sandboxes.find(withKeyEqualToAndNotUsed(key))

        if (sandbox) {
            sandbox.used = true
            sandbox.lastUsed = Date.now()
            sandbox.cached = true

            releaseLock()
            return sandbox
        }

        const oldestSandbox = sandboxes.reduce(byOldestNotUsed)

        oldestSandbox.lastUsed = Date.now()
        oldestSandbox.used = true
        oldestSandbox.cached = false
        oldestSandbox.key = key

        releaseLock()
        return oldestSandbox
    },

    async markAsNotCached(sandboxId: number): Promise<void> {
        const sandbox = sandboxes[sandboxId]

        if (isNil(sandbox)) {
            throw new Error(`[SandboxManager#markAsNotCached] Sandbox not found id=${sandboxId}`)
        }

        sandbox.key = null
    },

    async returnSandbox(sandboxId: number): Promise<void> {
        const releaseLock = await lock.acquire()
        const sandbox = sandboxes[sandboxId]

        if (isNil(sandbox)) {
            throw new Error(`[SandboxManager#returnSandbox] Sandbox not found id=${sandboxId}`)
        }

        sandbox.used = false
        releaseLock()
    },
}

const withKeyEqualToAndNotUsed = (key: string) => (s: Sandbox): boolean => s.key === key && !s.used

const byOldestNotUsed = (s1: Sandbox, s2: Sandbox): Sandbox => {
    if (s2.lastUsed < s1.lastUsed) {
        return s2
    }

    return s1
}
