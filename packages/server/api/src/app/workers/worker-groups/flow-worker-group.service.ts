import { ActivepiecesError, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import { apDayjsDuration } from '@activepieces/server-utils'
import { FlowOperationStatus, WorkerGroupScope, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { distributedStore } from '../../database/redis-connections'
import { flowRepo } from '../../flows/flow/flow.repo'
import { flowVersionRepo } from '../../flows/flow-version/flow-version.service'
import { machineService } from '../machine/machine-service'
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

    async assignFlowToGroup({ flowId, projectId, platformId, workerGroupId }: AssignFlowToGroupParams): Promise<void> {
        if (!isNil(workerGroupId) && !workerGroupQueues.isRoutableWorkerGroupId(workerGroupId)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: `"${workerGroupId}" is not a valid worker group id`,
                },
            })
        }
        if (!isNil(workerGroupId)) {
            const groupScopes = await machineService(log).getWorkerGroupScopes({ workerGroupId })
            if (groupScopes.length > 0 && !groupScopes.includes(WorkerGroupScope.FLOW)) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: {
                        message: `"${workerGroupId}" has no flow-scope workers and cannot be assigned to a flow`,
                    },
                })
            }
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
const GROUP_FLOWS_LIMIT = 10

type AssignFlowToGroupParams = {
    flowId: string
    projectId: string
    platformId: string
    workerGroupId: string | null
}

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
