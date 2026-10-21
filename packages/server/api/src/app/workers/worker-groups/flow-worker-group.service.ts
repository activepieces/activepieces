import { ActivepiecesError, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import { apDayjsDuration } from '@activepieces/server-utils'
import { WorkerGroupScope, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { distributedStore } from '../../database/redis-connections'
import { flowRepo } from '../../flows/flow/flow.repo'
import { platformQueueMigrationService } from './queue-migration.service'
import { NO_WORKER_GROUP_SENTINEL, workerGroupQueues } from './worker-group-queues'
import { workerGroupRouting } from './worker-group-routing'

export const flowWorkerGroupService = (log: FastifyBaseLogger) => ({
    async getFlowWorkerGroup({ flowId }: { flowId: string }): Promise<string | null> {
        const cached = await distributedStore.get<string>(getFlowWorkerGroupCacheKey(flowId))
        if (!isNil(cached)) {
            return cached === NO_WORKER_GROUP_SENTINEL ? null : cached
        }

        const flow = await flowRepo().findOne({
            select: ['id', 'workerGroupId'],
            where: { id: flowId },
        })

        const stored = flow?.workerGroupId ?? null
        const workerGroupId = !isNil(stored) && workerGroupQueues.isRoutableWorkerGroupId(stored) ? stored : null
        await distributedStore.put(getFlowWorkerGroupCacheKey(flowId), workerGroupId ?? NO_WORKER_GROUP_SENTINEL, CACHE_TTL_SECONDS)
        return workerGroupId
    },

    async invalidate({ flowId }: { flowId: string }): Promise<void> {
        await distributedStore.delete(getFlowWorkerGroupCacheKey(flowId))
    },

    async assignFlowToGroup({ flowId, projectId, platformId, workerGroupId }: AssignFlowToGroupParams): Promise<void> {
        if (!isNil(workerGroupId) && !workerGroupQueues.isRoutableWorkerGroupId(workerGroupId)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: `"${workerGroupId}" is not a valid worker group id`,
                },
            })
        }
        const flow = await flowRepo().findOneOrFail({
            select: ['id', 'workerGroupId'],
            where: { id: flowId, projectId },
        })
        const previousGroupId = flow.workerGroupId ?? null
        await flowRepo().update({ id: flowId, projectId }, { workerGroupId })
        await this.invalidate({ flowId })
        if (previousGroupId === workerGroupId) {
            return
        }
        const ungroupedQueueName = await workerGroupRouting.resolveQueueForJob({ platformId, projectId, jobType: WorkerJobType.EXECUTE_FLOW, log })
        const { error } = await tryCatch(() => platformQueueMigrationService(log).migrateFlowJobs({
            fromQueueName: isNil(previousGroupId) ? ungroupedQueueName : workerGroupQueues.getQueueName({ scope: WorkerGroupScope.FLOW, workerGroupId: previousGroupId }),
            toQueueName: isNil(workerGroupId) ? ungroupedQueueName : workerGroupQueues.getQueueName({ scope: WorkerGroupScope.FLOW, workerGroupId }),
            flowId,
        }))
        if (error) {
            log.error({ flow: { id: flowId }, project: { id: projectId }, error }, '[flowWorkerGroupService#assignFlowToGroup] Failed to migrate waiting jobs to the new worker group queue')
        }
    },
})

const getFlowWorkerGroupCacheKey = (flowId: string): string => `flow:${flowId}:worker_group`

const CACHE_TTL_SECONDS = apDayjsDuration(5, 'minute').asSeconds()

type AssignFlowToGroupParams = {
    flowId: string
    projectId: string
    platformId: string
    workerGroupId: string | null
}
