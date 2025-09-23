import { access, mkdir } from 'node:fs/promises'
import { join } from 'path'
import lockfile from 'proper-lockfile'



export const INFINITE_LOCK_TIMEOUT = 60 * 60 * 1000

export const fileSystemUtils = {
    fileExists: async (path: string): Promise<boolean> => {
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
    },

    threadSafeMkdir: async (path: string): Promise<void> => {
        try {
            await mkdir(path, { recursive: true })
        }
        catch (e) {
            const castedError = e as Error
            if ('code' in castedError && castedError.code === 'EEXIST') {
                return
            }
            throw e
        }
    },

    runExclusive: async <T>(directory: string, key: string, fn: () => Promise<T>, timeout = INFINITE_LOCK_TIMEOUT): Promise<T> => {
        const lockFolderPath = join(directory, 'activepieces-locks')
        const encodedKey = Buffer.from(key).toString('base64').replace(/[/+=]/g, '_')
        const lockPathFile = join(lockFolderPath, `${encodedKey}.lock`)
        let release
        try {
            await fileSystemUtils.threadSafeMkdir(lockFolderPath)
            release = await lockfile.lock(lockPathFile, {
                retries: {
                    retries: Math.ceil(timeout / 100),
                    factor: 1,
                    minTimeout: 100,
                    maxTimeout: 100,
                },
                stale: 30000,
                realpath: false,
            })
            return await fn()
        }
        finally {
            if (release) {
                await release()
            }
        }
    },
}
