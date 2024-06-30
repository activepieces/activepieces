import { Mutex } from 'async-mutex'

const memoryLocks = new Map<string, MutexLockWrapper>()
class MutexLockWrapper {
    private lock: Mutex

    constructor() {
        this.lock = new Mutex()
    }

    async acquire(): Promise<void> {
        await this.lock.acquire()
    }

    async release(): Promise<void> {
        this.lock.release()
    }
}


export const acquireMemoryLock = async (key: string): Promise<ApLock> => {
    let lock = memoryLocks.get(key)
    if (!lock) {
        lock = new MutexLockWrapper()
        memoryLocks.set(key, lock)
    }
    await lock.acquire()
    return lock
}


export type ApLock = {
    release(): Promise<unknown>
}

