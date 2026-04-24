import fs from 'fs/promises'
import { inspect } from 'node:util'
import path from 'path'
import { ConnectionsManager, ContextVersion, RespondHookParams, StopHookParams } from '@activepieces/pieces-framework'
import { ExecutionError, ExecutionErrorType, RespondResponse, Result, tryCatch } from '@activepieces/shared'
import { createConnectionResolver } from './piece-context/connection-resolver'

export type FileEntry = {
    name: string
    path: string
}

export const utils = {
    async tryCatchAndThrowOnEngineError<T>(fn: () => Promise<T>): Promise<Result<T, ExecutionError>> {
        const result = await tryCatch<T, ExecutionError>(fn)
        if (isEngineError(result.error)) {
            throw result.error
        }
        return result
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

        await walkRecursive(dirPath)
        return entries
    },
    formatExecutionError(value: ExecutionError): string {
        try {
            return JSON.stringify({
                ...value,
                ...JSON.parse(value.message),
            }, null, 2)
        }
        catch (e) {
            return inspect(value)
        }
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
                const connection = await createConnectionResolver({ projectId: params.projectId, engineToken: params.engineToken, apiUrl: params.apiUrl, contextVersion: params.contextVersion }).obtain(key)
                if (params.target === 'actions') {
                    params.hookResponse.tags.push(`connection:${key}`)
                }
                return connection
            },
        }
    },
    sizeof(object: unknown): number {
        return Buffer.byteLength(JSON.stringify(object) ?? '', 'utf8')
    },
}

function isEngineError(error: unknown): error is ExecutionError {
    return error instanceof ExecutionError && error.type === ExecutionErrorType.ENGINE
}

export type HookResponse = {
    tags: string[]
    responseToSend?: RespondResponse
} & ({
    type: 'paused'
} | {
    type: 'stopped'
    response: StopHookParams
} | {
    type: 'respond'
    response: RespondHookParams
} | {
    type: 'none'
})
type CreateConnectionManagerParams = { projectId: string, engineToken: string, apiUrl: string, target: 'triggers' | 'properties', contextVersion: ContextVersion | undefined } | { projectId: string, engineToken: string, apiUrl: string, target: 'actions', hookResponse: HookResponse, contextVersion: ContextVersion | undefined }