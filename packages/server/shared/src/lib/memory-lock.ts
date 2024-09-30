import { E_TIMEOUT, Mutex, MutexInterface, withTimeout } from 'async-mutex'

const memoryLocks = new Map<string, MutexLockWrapper>()
class MutexLockWrapper {
    private lock: MutexInterface

    constructor(timeout?: number) {
        if (timeout) {
            this.lock = withTimeout(new Mutex(), timeout)
        }
        else {
            this.lock = new Mutex()
        }
    }

    async acquire(): Promise<void> {
        await this.lock.acquire()
    }

    async release(): Promise<void> {
        this.lock.release()
    }
}



export const memoryLock = {
    acquire: async (key: string, timeout?: number): Promise<ApLock> => {
        let lock = memoryLocks.get(key)
        if (!lock) {
            lock = new MutexLockWrapper(timeout)
            memoryLocks.set(key, lock)
        }
        await lock.acquire()
        return lock
    },
    isTimeoutError: (e: unknown): boolean => {
        return e === E_TIMEOUT
    },
}

export type ApLock = {
    release(): Promise<unknown>
}
