import { logger, system, SystemProp } from '@activepieces/server-shared'
import { ApEnvironment, isNil } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import { extractProvisionCacheKey, ProvisionCacheInfo, SandBoxCacheType } from '../provisioner/sandbox-cache-key'
import { CachedSandbox } from './cached-sandbox'

const CACHED_SANDBOX_LIMIT = 1000

const cachedSandboxes = new Map<string, CachedSandbox>()
const lock: Mutex = new Mutex()

const sandboxKeyCachePool = {
    async findOrCreate(cacheInfo: ProvisionCacheInfo): Promise<CachedSandbox> {
        logger.debug(cacheInfo, '[SandboxCachePool#get]')

        const key = extractProvisionCacheKey(cacheInfo)
        const cachedSandbox = await lock.runExclusive((): CachedSandbox => {
            const cachedSandbox = cachedSandboxes.get(key)

            if (cachedSandbox) {
                return cachedSandbox
            }

            if (cachedSandboxes.size >= CACHED_SANDBOX_LIMIT) {
                deleteOldestNotInUseOrThrow()
            }

            return createCachedSandbox({ key })
        })

        await cachedSandbox.init()
        return cachedSandbox
    },

    async release({ key }: ReleaseParams): Promise<void> {
        const cachedSandbox = getOrThrow({ key })
        await cachedSandbox.decrementActiveSandboxCount()
    },
}

const sandboxNoCachePool = {
    async findOrCreate(_cacheInfo: ProvisionCacheInfo): Promise<CachedSandbox> {
        return sandboxKeyCachePool.findOrCreate({
            type: SandBoxCacheType.NONE,
        })
    },
    async release({ key }: ReleaseParams): Promise<void> {
        return sandboxKeyCachePool.release({ key })
    },
}

export const sandboxCachePool = system.get(SystemProp.ENVIRONMENT) === ApEnvironment.DEVELOPMENT ? sandboxNoCachePool : sandboxKeyCachePool

const getOrThrow = ({ key }: GetOrThrowParams): CachedSandbox => {
    const cachedSandbox = cachedSandboxes.get(key)

    if (isNil(cachedSandbox)) {
        throw new Error(`[SandboxCachePool#getOrThrow] sandbox not found key=${key}`)
    }

    return cachedSandbox
}

const createCachedSandbox = ({ key }: CreateCachedSandboxParams): CachedSandbox => {
    const newCachedSandBox = new CachedSandbox({
        key,
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


type ReleaseParams = {
    key: string
}

type GetOrThrowParams = {
    key: string
}

type CreateCachedSandboxParams = {
    key: string
}
