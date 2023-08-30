import { mkdir } from 'node:fs/promises'
import { Mutex } from 'async-mutex'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'

const CACHE_PATH = system.get(SystemProp.CACHE_PATH) ?? '/usr/src/cache'

class CachedSandbox {
    public readonly key: string
    private _initialized = false

    constructor(key: string) {
        this.key = key
    }

    public get initialized(): boolean {
        return this._initialized
    }

    path(): string {
        return `${CACHE_PATH}/sandbox/${this.key}`
    }

    async init(): Promise<void> {
        await mkdir(this.path(), { recursive: true })
        this._initialized = true
    }
}

const cachedSandboxes = new Map<string, CachedSandbox>()
const lock: Mutex = new Mutex()

export const sandboxCachePool = {
    async getByKey(key: string): Promise<CachedSandbox> {
        const cachedSandbox = await executeWithLock((): CachedSandbox => {
            const cachedSandbox = cachedSandboxes.get(key)

            if (cachedSandbox) {
                return cachedSandbox
            }

            const newCachedSandBox = new CachedSandbox(key)
            cachedSandboxes.set(key, newCachedSandBox)
            return newCachedSandBox
        })

        if (!cachedSandbox.initialized) {
            await cachedSandbox.init()
        }

        return cachedSandbox
    },
}

const executeWithLock = async <T>(methodToExecute: () => T): Promise<T> => {
    const releaseLock = await lock.acquire()

    try {
        return methodToExecute()
    }
    finally {
        releaseLock()
    }
}
