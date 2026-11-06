import { isNil } from '@activepieces/core-utils'
import { apDayjsDuration } from '@activepieces/server-utils'
import { FlowOperationStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { distributedStore } from '../../database/redis-connections'
import { flowRepo } from '../../flows/flow/flow.repo'
import { flowVersionRepo } from '../../flows/flow-version/flow-version.service'
import { NO_WORKER_GROUP_SENTINEL, workerGroupQueues } from './worker-group-queues'

export const flowWorkerGroupService = (_log: FastifyBaseLogger) => ({
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

    async invalidateMany({ flowIds }: { flowIds: string[] }): Promise<void> {
        if (flowIds.length === 0) {
            return
        }
        await distributedStore.delete(flowIds.map(getFlowWorkerGroupCacheKey))
    },

    async invalidate({ flowId }: { flowId: string }): Promise<void> {
        await distributedStore.delete(getFlowWorkerGroupCacheKey(flowId))
    },

    async listGroupFlows({ platformId, workerGroupId }: ListGroupFlowsParams): Promise<WorkerGroupFlows> {
        const groupFlowsQuery = flowRepo()
            .createQueryBuilder('flow')
            .innerJoin('project', 'project', 'project.id = flow."projectId"')
            .where('project."platformId" = :platformId', { platformId })
            .andWhere('flow."workerGroupId" = :workerGroupId', { workerGroupId })
            .andWhere('flow."operationStatus" != :deleting', { deleting: FlowOperationStatus.DELETING })
        const total = await groupFlowsQuery.getCount()
        const flows = await groupFlowsQuery
            .orderBy('flow.created', 'DESC')
            .take(GROUP_FLOWS_LIMIT)
            .getMany()
        if (flows.length === 0) {
            return { flows: [], total }
        }
        const latestVersions = await flowVersionRepo()
            .createQueryBuilder('fv')
            .select('fv."flowId"', 'flowId')
            .addSelect('fv."displayName"', 'displayName')
            .distinctOn(['fv."flowId"'])
            .where('fv."flowId" IN (:...flowIds)', { flowIds: flows.map((flow) => flow.id) })
            .orderBy('fv."flowId"')
            .addOrderBy('fv.created', 'DESC')
            .getRawMany<{ flowId: string, displayName: string }>()
        const displayNameByFlowId = new Map(latestVersions.map((version) => [version.flowId, version.displayName]))
        return {
            flows: flows.map((flow) => ({
                id: flow.id,
                projectId: flow.projectId,
                displayName: displayNameByFlowId.get(flow.id) ?? flow.id,
            })),
            total,
        }
    },

})

const getFlowWorkerGroupCacheKey = (flowId: string): string => `flow:${flowId}:worker_group`

const CACHE_TTL_SECONDS = apDayjsDuration(5, 'minute').asSeconds()
const GROUP_FLOWS_LIMIT = 10


type ListGroupFlowsParams = {
    platformId: string
    workerGroupId: string
}

type WorkerGroupFlows = {
    flows: Array<{
        id: string
        projectId: string
        displayName: string
    }>
    total: number
}
