import { isNil, spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import { apDayjsDuration } from '@activepieces/server-utils'
import { WorkerGroupScope } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { distributedStore } from '../../database/redis-connections'
import { projectRepo } from '../../project/project-repo'
import { QueueName } from '../job'
import { platformWorkerGroupService } from './platform-worker-group.service'
import { platformQueueMigrationService } from './queue-migration.service'
import { workerGroupQueues } from './worker-group-queues'

export const projectWorkerGroupService = (log: FastifyBaseLogger) => ({
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
    async getWorkerGroupProjects({ workerGroupId }: { workerGroupId: string }): Promise<string[]> {
        const projects = await projectRepo().find({
            select: ['id'],
            where: { workerGroupId },
        })
        return projects.map((p) => p.id)
    },

    async invalidate({ projectId }: { projectId: string }): Promise<void> {
        await distributedStore.delete(getProjectWorkerGroupCacheKey(projectId))
    },

    async migrateProjectToGroup({ projectId, platformId, fromGroupId, toGroupId }: MigrateProjectToGroupParams): Promise<void> {
        const ungroupedQueueName = await resolveUngroupedQueueName({ platformId, log })
        const { error } = await tryCatch(() => platformQueueMigrationService(log).migrateProjectJobs({
            fromQueueName: isNil(fromGroupId) ? ungroupedQueueName : workerGroupQueues.getQueueName({ scope: WorkerGroupScope.PROJECT, workerGroupId: fromGroupId }),
            toQueueName: isNil(toGroupId) ? ungroupedQueueName : workerGroupQueues.getQueueName({ scope: WorkerGroupScope.PROJECT, workerGroupId: toGroupId }),
            projectId,
        }))
        if (error) {
            log.error({ project: { id: projectId }, platform: { id: platformId }, error }, '[projectWorkerGroupService#migrateProjectToGroup] Failed to migrate waiting jobs to the new worker group queue')
        }
    },
})

async function resolveUngroupedQueueName({ platformId, log }: { platformId: string, log: FastifyBaseLogger }): Promise<string> {
    const platformGroupId = await platformWorkerGroupService(log).getWorkerGroupId({ platformId })
    return isNil(platformGroupId) ? QueueName.WORKER_JOBS : workerGroupQueues.getQueueName({ scope: WorkerGroupScope.PLATFORM, workerGroupId: platformGroupId })
}

const getProjectWorkerGroupCacheKey = (projectId: string): string => `project:${projectId}:worker_group`

const NO_WORKER_GROUP_SENTINEL = '__none__'
const CACHE_TTL_SECONDS = apDayjsDuration(5, 'minute').asSeconds()

type MigrateProjectToGroupParams = {
    projectId: string
    platformId: string
    fromGroupId: string | null
    toGroupId: string | null
}
