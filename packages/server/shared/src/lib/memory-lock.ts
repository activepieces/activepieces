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
}

export type ApLock = {
    release(): Promise<unknown>
}
