import { E_TIMEOUT, Mutex, MutexInterface, withTimeout } from 'async-mutex'

const memoryLocks = new Map<string, MutexInterface>()

export const memoryLock = {
    acquire: async (key: string, timeout?: number): Promise<ApLock> => {
        let lock = memoryLocks.get(key)
        if (!lock) {
            if (timeout) {
                lock = withTimeout(new Mutex(), timeout)
            }
            else {
                lock = new Mutex()
            }
            memoryLocks.set(key, lock)
        }
        const release = await lock.acquire()
        return {
            release: async () => {
                release()
            },
        }
    },
    isTimeoutError: (e: unknown): boolean => {
        return e === E_TIMEOUT
    },
    runExclusive: async <T>({ key, fn }: RunExclusiveParams<T>): Promise<T> => {
        const lock = await memoryLock.acquire(key)
        try {
            return await fn()
        }
        finally {
            await lock.release()
        }
    },
}

type RunExclusiveParams<T> = {
    key: string
    fn: () => Promise<T>
}

export type ApLock = {
    release(): Promise<unknown>
}
