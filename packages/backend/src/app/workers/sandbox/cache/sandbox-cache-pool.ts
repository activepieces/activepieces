import { Mutex } from 'async-mutex'
import { CachedSandbox } from './cached-sandbox'
import { SandBoxCacheType } from '../provisioner/sandbox-cache-type'

const cachedSandboxes = new Map<string, CachedSandbox>()
const lock: Mutex = new Mutex()

export const sandboxCachePool = {
    async getByKey({ type, key }: GetByKeyParams): Promise<CachedSandbox> {
        const cachedSandbox = await executeWithLock((): CachedSandbox => {
            const cachedSandbox = cachedSandboxes.get(key)

            if (cachedSandbox) {
                return cachedSandbox
            }

            const newCachedSandBox = new CachedSandbox({
                key,
                type,
            })

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

type GetByKeyParams = {
    key: string
    type: SandBoxCacheType
}
