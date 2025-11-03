import fs from 'fs/promises'
import { readFile } from 'node:fs/promises'
import { inspect } from 'node:util'
import path from 'path'
import { ConnectionsManager, PauseHookParams, RespondHookParams, StopHookParams } from '@activepieces/pieces-framework'
import { ConnectionValue, createConnectionService } from './services/connections.service'
import { tryCatchAndThrowEngineError } from './helper/try-catch'
import { EngineGenericError } from './helper/execution-errors'

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
            throw new EngineGenericError('ParseJsonFileError', `Failed to parse JSON file: ${filePath}`)
        }
    },
    async walk(dirPath: string): Promise<FileEntry[]> {
        const entries: FileEntry[] = []

        async function walkRecursive(currentPath: string) {
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

        await tryCatchAndThrowEngineError(walkRecursive(dirPath))
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
                const { data: connection } = await tryCatchAndThrowEngineError(getConnectionValue({ key, data: params }))
                return connection
            },
        }
    },
}

async function getConnectionValue(params: GetConnectionValueParams): Promise<ConnectionValue> {
    const { key, data } = params
    const connection = await createConnectionService({ projectId: data.projectId, engineToken: data.engineToken, apiUrl: data.apiUrl }).obtain(key)
    if (data.target === 'actions') {
        data.hookResponse.tags.push(`connection:${key}`)
    }
    return connection
}

type GetConnectionValueParams = {
    key: string
    data: CreateConnectionManagerParams
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