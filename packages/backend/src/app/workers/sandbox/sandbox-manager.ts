import { Mutex } from 'async-mutex'
import { Sandbox } from './'

class SandboxManager {
    private static _instance?: SandboxManager

    private readonly sandboxes = new Map<number, Sandbox>()
    private readonly mutex: Mutex = new Mutex()

    private constructor() {
        if (SandboxManager._instance != null) {
            throw new Error('Use Singleton.instance instead of new.')
        }
        for (let boxId = 0; boxId < 1000; ++boxId) {
            this.sandboxes.set(boxId, new Sandbox({
                boxId,
                cached: false,
                used: false,
                resourceId: null,
                lastUsed: 0,
            }))
        }
        SandboxManager._instance = this
    }

    async obtainSandbox(key: string): Promise<Sandbox> {
        // Acquire the lock
        const release = await this.mutex.acquire()

        // Find sandbox with resourceId equal to key and not used
        const sandbox = Array.from(this.sandboxes.values()).find(s => s.resourceId === key && !s.used)
        if (sandbox) {
            sandbox.used = true
            sandbox.lastUsed = Date.now()
            sandbox.cached = true

            // Release the lock
            release()

            return sandbox
        }

        // Find oldest sandbox not used
        const oldestSandbox = Array.from(this.sandboxes.values()).reduce((oldest, current) => {
            if (current.lastUsed < oldest.lastUsed) {
                return current
            }

            return oldest
        })

        if (oldestSandbox === null) {
            new Error('No sandbox available')
        }
        oldestSandbox.lastUsed = Date.now()
        oldestSandbox.used = true
        oldestSandbox.cached = false
        oldestSandbox.resourceId = key

        // Release the lock
        release()

        return oldestSandbox
    }

    async markAsNotCached(sandboxId: number): Promise<void> {
        const sandbox = this.sandboxes.get(sandboxId)
        if (!sandbox) {
            throw new Error('Sandbox not found')
        }
        sandbox.resourceId = null
    }

    async returnSandbox(sandboxId: number): Promise<void> {
        const release = await this.mutex.acquire()
        const sandbox = this.sandboxes.get(sandboxId)
        if (!sandbox) {
            throw new Error('Sandbox not found')
        }
        sandbox.used = false
        release()
    }

    static get instance(): SandboxManager {
        return SandboxManager._instance ?? (SandboxManager._instance = new SandboxManager())
    }
}

export const sandboxManager = SandboxManager.instance
