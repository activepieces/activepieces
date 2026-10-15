import { ActivepiecesError, ErrorCode, isNil, spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import { apDayjsDuration } from '@activepieces/server-utils'
import { WorkerGroupScope } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { distributedStore } from '../../database/redis-connections'
import { projectRepo } from '../../project/project-repo'
import { QueueName } from '../job'
import { platformWorkerGroupService } from './platform-worker-group.service'
import { platformQueueMigrationService } from './queue-migration.service'
import { NO_WORKER_GROUP_SENTINEL, workerGroupQueues } from './worker-group-queues'

export const projectWorkerGroupService = (log: FastifyBaseLogger) => ({
    async getProjectWorkerGroup({ projectId, platformId }: { projectId: string, platformId?: string | null }): Promise<string | null> {
        const cached = await distributedStore.get<string>(getProjectWorkerGroupCacheKey(projectId))
        if (!isNil(cached)) {
            return cached === NO_WORKER_GROUP_SENTINEL ? null : cached
        }

        const project = await projectRepo().findOne({
            select: ['id', 'workerGroupId'],
            where: { id: projectId, ...spreadIfDefined('platformId', platformId ?? undefined) },
        })

        const stored = project?.workerGroupId ?? null
        const workerGroupId = !isNil(stored) && workerGroupQueues.isRoutableWorkerGroupId(stored) ? stored : null
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

    async assignProjectToGroup({ projectId, platformId, workerGroupId }: AssignProjectToGroupParams): Promise<void> {
        if (!isNil(workerGroupId) && !workerGroupQueues.isRoutableWorkerGroupId(workerGroupId)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: `"${workerGroupId}" is not a valid worker group id`,
                },
            })
        }
        const project = await projectRepo().findOne({
            select: ['id', 'workerGroupId'],
            where: { id: projectId, platformId },
        })
        if (isNil(project)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: projectId,
                    entityType: 'project',
                },
            })
        }
        const previousGroupId = project.workerGroupId ?? null
        await projectRepo().update({ id: projectId, platformId }, { workerGroupId })
        await this.invalidate({ projectId })
        if (previousGroupId === workerGroupId) {
            return
        }
        const ungroupedQueueName = await resolveUngroupedQueueName({ platformId, log })
        const { error } = await tryCatch(() => platformQueueMigrationService(log).migrateProjectJobs({
            fromQueueName: isNil(previousGroupId) ? ungroupedQueueName : workerGroupQueues.getQueueName({ scope: WorkerGroupScope.PROJECT, workerGroupId: previousGroupId }),
            toQueueName: isNil(workerGroupId) ? ungroupedQueueName : workerGroupQueues.getQueueName({ scope: WorkerGroupScope.PROJECT, workerGroupId }),
            projectId,
        }))
        if (error) {
            log.error({ project: { id: projectId }, platform: { id: platformId }, error }, '[projectWorkerGroupService#assignProjectToGroup] Failed to migrate waiting jobs to the new worker group queue')
        }
    },
})

async function resolveUngroupedQueueName({ platformId, log }: { platformId: string, log: FastifyBaseLogger }): Promise<string> {
    const platformGroupId = await platformWorkerGroupService(log).getWorkerGroupId({ platformId })
    return isNil(platformGroupId) ? QueueName.WORKER_JOBS : workerGroupQueues.getQueueName({ scope: WorkerGroupScope.PLATFORM, workerGroupId: platformGroupId })
}

const getProjectWorkerGroupCacheKey = (projectId: string): string => `project:${projectId}:worker_group`

const CACHE_TTL_SECONDS = apDayjsDuration(5, 'minute').asSeconds()

type AssignProjectToGroupParams = {
    projectId: string
    platformId: string
    workerGroupId: string | null
}
