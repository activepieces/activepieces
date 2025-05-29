import { readFile } from 'node:fs/promises'
import { ConnectionsManager, PauseHookParams, RespondHookParams, StopHookParams } from '@activepieces/pieces-framework'
import { createConnectionService } from './services/connections.service'

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


    tryParseJson(value: string): unknown {
        try {
            return JSON.parse(value)
        }
        catch (e) {
            return value
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
type CreateConnectionManagerParams =  { projectId: string, engineToken: string, apiUrl: string, target: 'triggers' } | { projectId: string, engineToken: string, apiUrl: string, target: 'actions', hookResponse: HookResponse }