import fs from 'fs/promises'
import { readFile } from 'node:fs/promises'
import { inspect } from 'node:util'
import path from 'path'
import { ConnectionsManager, PauseHookParams, RespondHookParams, StopHookParams } from '@activepieces/pieces-framework'
import { createConnectionService } from './services/connections.service'

export type FileEntry = {
    name: string
    path: string
}

export const utils = {
    async parseJsonFile<T>(filePath: string): Promise<T> {
        try {
            const file = await readFile(filePath, 'utf-8')
            return JSON.parse(file)
        }
        catch (e) {
            throw Error((e as Error).message)
        }
    },
    async walk(dirPath: string): Promise<FileEntry[]> {
        const entries: FileEntry[] = []

        async function walkRecursive(currentPath: string) {
            try {
                const items = await fs.readdir(currentPath, { withFileTypes: true })

                for (const item of items) {
                    const fullPath = path.join(currentPath, item.name)
                    const absolutePath = path.resolve(fullPath)

                    entries.push({
                        name: item.name,
                        path: absolutePath,
                    })

                    if (item.isDirectory()) {
                        await walkRecursive(fullPath)
                    }
                }
            }
            catch (error) {
                // Skip directories that can't be read
            }
        }

        await walkRecursive(dirPath)
        return entries
    },
    formatError(value: Error): string {
        try {
            return JSON.stringify(JSON.parse(value.message), null, 2)
        }
        catch (e) {
            return inspect(value)
        }
    },
    async folderExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath)
            return true
        }
        catch {
            return false
        }
    },
    createConnectionManager(params: CreateConnectionManagerParams): ConnectionsManager {
        return {
            get: async (key: string) => {
                try {
                    const { projectId, engineToken, apiUrl, target } = params
                    const connection = await createConnectionService({ projectId, engineToken, apiUrl }).obtain(key)
                    if (target === 'actions') {
                        params.hookResponse.tags.push(`connection:${key}`)
                    }
                    return connection
                }
                catch (e) {
                    return null
                }
            },
        }
    },
}

export type HookResponse = {
    type: 'paused'
    tags: string[]
    response: PauseHookParams
} | {
    type: 'stopped'
    tags: string[]
    response: StopHookParams
} | {
    type: 'respond'
    tags: string[]
    response: RespondHookParams
} | {
    type: 'none'
    tags: string[]
}
type CreateConnectionManagerParams = { projectId: string, engineToken: string, apiUrl: string, target: 'triggers' | 'properties' } | { projectId: string, engineToken: string, apiUrl: string, target: 'actions', hookResponse: HookResponse }