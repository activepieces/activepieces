import { access, mkdir, realpath, unlink } from 'node:fs/promises'
import nodePath from 'node:path'
import { tryCatch } from '@activepieces/shared'

export const INFINITE_LOCK_TIMEOUT = 60 * 60 * 1000

async function resolveRealpathThroughMissingTail(targetPath: string): Promise<string> {
    const absolute = nodePath.resolve(targetPath)
    const segments = absolute.split(nodePath.sep).filter((segment) => segment.length > 0)
    let existing: string = nodePath.sep
    let consumed = 0
    for (const segment of segments) {
        const candidate = nodePath.join(existing, segment)
        const { error } = await tryCatch(() => access(candidate))
        if (error !== null) {
            break
        }
        existing = candidate
        consumed++
    }
    const resolvedExisting = await realpath(existing)
    if (consumed === segments.length) {
        return resolvedExisting
    }
    return nodePath.join(resolvedExisting, ...segments.slice(consumed))
}

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

    assertPathInside: async ({ baseDir, targetPath }: { baseDir: string, targetPath: string }): Promise<void> => {
        const realBase = await realpath(baseDir)
        const realTarget = await resolveRealpathThroughMissingTail(targetPath)
        const baseWithSep = realBase.endsWith(nodePath.sep) ? realBase : realBase + nodePath.sep
        if (realTarget !== realBase && !realTarget.startsWith(baseWithSep)) {
            throw new Error(`path escape detected: "${targetPath}" resolves to "${realTarget}" which is outside "${realBase}"`)
        }
    },
}
