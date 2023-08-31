import { mkdir } from 'node:fs/promises'
import { Mutex } from 'async-mutex'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'

const CACHE_PATH = system.get(SystemProp.CACHE_PATH) ?? '/usr/src/cache'

export enum CachedSandboxState {
    /**
     * Sandbox object was created
     */
    CREATED = 'CREATED',

    /**
     * Init method was called on sandbox
     */
    INITIALIZED = 'INITIALIZED',

    /**
     * Dependencies, pieces, engine were installed on the sandbox, and it's ready to serve requests
     */
    READY = 'READY',
}

export class CachedSandbox {
    public readonly key: string
    private _state = CachedSandboxState.CREATED

    constructor(key: string) {
        this.key = key
    }

    public get state(): CachedSandboxState {
        return this._state
    }

    path(): string {
        return `${CACHE_PATH}/sandbox/${this.key}`
    }

    async init(): Promise<void> {
        if (this._state !== CachedSandboxState.CREATED) {
            return
        }

        await mkdir(this.path(), { recursive: true })
        this._state = CachedSandboxState.INITIALIZED
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

        await cachedSandbox.init()
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
