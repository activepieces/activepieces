import { access, mkdir, unlink } from 'node:fs/promises'
import { tryCatch } from '@activepieces/shared'

export const INFINITE_LOCK_TIMEOUT = 60 * 60 * 1000

export const fileSystemUtils = {
    fileExists: async (path: string): Promise<boolean> => {
        const { error } = await tryCatch(() => access(path))
        if (error === null) {
            return true
        }
        if ('code' in error && error.code === 'ENOENT') {
            return false
        }
        throw error
    },

    threadSafeMkdir: async (path: string): Promise<void> => {
        const { error } = await tryCatch(() => mkdir(path, { recursive: true }))
        if (error === null) {
            return
        }
        if ('code' in error && error.code === 'EEXIST') {
            return
        }
        throw error
    },

    deleteFile: async (path: string): Promise<void> => {
        if (await fileSystemUtils.fileExists(path)) {
            await unlink(path)
        }
    },
}
