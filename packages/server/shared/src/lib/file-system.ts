import { access, mkdir } from 'node:fs/promises'
import { memoryLock } from './memory-lock'

export const fileExists = async (path: string): Promise<boolean> => {
    try {
        await access(path)
        return true
    }
    catch (e) {
        const castedError = e as Error
        if ('code' in castedError && castedError.code === 'ENOENT') {
            return false
        }

        throw e
    }
}

export async function threadSafeMkdir(path: string): Promise<void> {
    const fExists = await fileExists(path)
    if (fExists) {
        return
    }
    const lock = await memoryLock.acquire(`mkdir-${path}`)
    try {
        await mkdir(path, { recursive: true })
    }
    finally {
        await lock.release()
    }
}
