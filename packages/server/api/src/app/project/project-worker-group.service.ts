import { isNil, spreadIfDefined } from '@activepieces/core-utils'
import { apDayjsDuration } from '@activepieces/server-utils'
import { FastifyBaseLogger } from 'fastify'
import { distributedStore } from '../database/redis-connections'
import { projectRepo } from './project-repo'

const NO_WORKER_GROUP_SENTINEL = '__none__'
const CACHE_TTL_SECONDS = apDayjsDuration(5, 'minute').asSeconds()
const getProjectWorkerGroupCacheKey = (projectId: string): string => `project:${projectId}:worker_group`

export const projectWorkerGroupService = (_log: FastifyBaseLogger) => ({
    async getProjectWorkerGroup({ projectId, platformId }: { projectId: string, platformId?: string | null }): Promise<string | null> {
        const cached = await distributedStore.get<string>(getProjectWorkerGroupCacheKey(projectId))
        if (!isNil(cached)) {
            return cached === NO_WORKER_GROUP_SENTINEL ? null : cached
        }

        const project = await projectRepo().findOne({
            select: ['workerGroupId'],
            where: { id: projectId, ...spreadIfDefined('platformId', platformId ?? undefined) },
        })

        const workerGroupId = project?.workerGroupId ?? null
        await distributedStore.put(getProjectWorkerGroupCacheKey(projectId), workerGroupId ?? NO_WORKER_GROUP_SENTINEL, CACHE_TTL_SECONDS)
        return workerGroupId
    },

    async invalidate({ projectId }: { projectId: string }): Promise<void> {
        await distributedStore.delete(getProjectWorkerGroupCacheKey(projectId))
    },
})
