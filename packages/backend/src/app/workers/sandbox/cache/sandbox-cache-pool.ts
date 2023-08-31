import { Mutex } from 'async-mutex'
import { CachedSandbox } from './cached-sandbox'
import { SandBoxCacheType } from '../provisioner/sandbox-cache-type'
import { logger } from '../../../helper/logger'
import { isNil } from '@activepieces/shared'

const CACHED_SANDBOX_LIMIT = 1000

const cachedSandboxes = new Map<string, CachedSandbox>()
const lock: Mutex = new Mutex()

export const sandboxCachePool = {
    async findOrCreate({ type, key }: FindOrCreateParams): Promise<CachedSandbox> {
        logger.debug({ type, key }, '[SandboxCachePool#get]')

        const cachedSandbox = await executeWithLock((): CachedSandbox => {
            const cachedSandbox = cachedSandboxes.get(key)

            if (cachedSandbox) {
                return cachedSandbox
            }

            if (cachedSandboxes.size >= CACHED_SANDBOX_LIMIT) {
                deleteOldestNotInUseOrThrow()
            }

            return createCachedSandbox({ key, type })
        })

        await cachedSandbox.init()
        return cachedSandbox
    },

    async release({ key }: ReleaseParams): Promise<void> {
        const cachedSandbox = getOrThrow({ key })
        cachedSandbox.decrementActiveSandboxCount()
    },
}

const getOrThrow = ({ key }: GetOrThrowParams): CachedSandbox => {
    const cachedSandbox = cachedSandboxes.get(key)

    if (isNil(cachedSandbox)) {
        throw new Error(`[SandboxCachePool#getOrThrow] sandbox not found key=${key}`)
    }

    return cachedSandbox
}

const createCachedSandbox = ({ key, type }: CreateCachedSandboxParams): CachedSandbox => {
    const newCachedSandBox = new CachedSandbox({
        key,
        type,
    })

    cachedSandboxes.set(key, newCachedSandBox)
    return newCachedSandBox
}

const deleteOldestNotInUseOrThrow = (): void => {
    let oldestNotInUseCachedSandbox: CachedSandbox | null = null

    for (const cachedSandbox of cachedSandboxes.values()) {
        if (!cachedSandbox.isInUse()) {
            if (isNil(oldestNotInUseCachedSandbox)) {
                oldestNotInUseCachedSandbox = cachedSandbox
                continue
            }

            if (cachedSandbox.lastUsedAt().isBefore(oldestNotInUseCachedSandbox.lastUsedAt())) {
                oldestNotInUseCachedSandbox = cachedSandbox
            }
        }
    }

    if (isNil(oldestNotInUseCachedSandbox)) {
        throw new Error('[SandboxCachePool#getOldestNotInUseOrThrow] all sandboxes are in use')
    }

    cachedSandboxes.delete(oldestNotInUseCachedSandbox.key)
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

type FindOrCreateParams = {
    key: string
    type: SandBoxCacheType
}

type ReleaseParams = {
    key: string
}

type GetOrThrowParams = {
    key: string
}

type CreateCachedSandboxParams = {
    key: string
    type: SandBoxCacheType
}
