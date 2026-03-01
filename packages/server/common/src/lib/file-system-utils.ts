import { access, mkdir, unlink } from 'node:fs/promises'


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

    deleteFile: async (path: string): Promise<void> => {
        if (await fileSystemUtils.fileExists(path)) {
            await unlink(path)
        }
    },
}
