import { isNil } from '@activepieces/core-utils'
import { apDayjsDuration } from '@activepieces/server-utils'
import { FastifyBaseLogger } from 'fastify'
import { distributedStore } from '../database/redis-connections'
import { projectRepo } from './project-repo'

const NO_WORKER_TAG_SENTINEL = '__none__'
const CACHE_TTL_SECONDS = apDayjsDuration(5, 'minute').asSeconds()
const getProjectWorkerTagCacheKey = (projectId: string): string => `project:${projectId}:worker_tag`

export const projectWorkerTagService = (_log: FastifyBaseLogger) => ({
    async getProjectWorkerTag({ projectId }: { projectId: string }): Promise<string | null> {
        const cached = await distributedStore.get<string>(getProjectWorkerTagCacheKey(projectId))
        if (!isNil(cached)) {
            return cached === NO_WORKER_TAG_SENTINEL ? null : cached
        }

        const project = await projectRepo().findOne({
            select: ['workerTag'],
            where: { id: projectId },
        })

        const workerTag = project?.workerTag ?? null
        await distributedStore.put(getProjectWorkerTagCacheKey(projectId), workerTag ?? NO_WORKER_TAG_SENTINEL, CACHE_TTL_SECONDS)
        return workerTag
    },

    async invalidate({ projectId }: { projectId: string }): Promise<void> {
        await distributedStore.delete(getProjectWorkerTagCacheKey(projectId))
    },
})
