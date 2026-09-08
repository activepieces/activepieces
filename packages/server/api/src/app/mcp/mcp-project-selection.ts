import { distributedStore } from '../database/redis-connections'

const KEY_PREFIX = 'mcp-project-selection:'
const TTL_SECONDS = 24 * 60 * 60

function resolveKey({ platformId, userId, clientId }: ProjectSelectionScope): string {
    return `${KEY_PREFIX}client:${platformId}:${userId}:${clientId}`
}

export const mcpProjectSelection = {
    async get(scope: ProjectSelectionScope): Promise<string | null> {
        return distributedStore.get<string>(resolveKey(scope))
    },
    async set({ scope, projectId }: { scope: ProjectSelectionScope, projectId: string }): Promise<void> {
        await distributedStore.put(resolveKey(scope), projectId, TTL_SECONDS)
    },
    async clear(scope: ProjectSelectionScope): Promise<void> {
        await distributedStore.delete(resolveKey(scope))
    },
}

export type ProjectSelectionScope = {
    platformId: string
    userId: string
    clientId: string
}
