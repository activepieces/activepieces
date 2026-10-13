import { isNil } from '@activepieces/core-utils'
import { WorkerGroupScope, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { QueueName } from '../job'
import { flowWorkerGroupService } from './flow-worker-group.service'
import { platformWorkerGroupService } from './platform-worker-group.service'
import { projectWorkerGroupService } from './project-worker-group.service'
import { PROJECT_GROUP_ROUTABLE_JOB_TYPES, WorkerGroupAssignment, workerGroupQueues } from './worker-group-queues'

const resolveQueueForJob = async ({ platformId, projectId, flowId, jobType, log }: ResolveQueueForJobParams): Promise<string> => {
    if (!isNil(platformId) && !isNil(projectId) && !isNil(jobType) && PROJECT_GROUP_ROUTABLE_JOB_TYPES.has(jobType)) {
        const workerGroupsEnabled = await platformWorkerGroupService(log).isWorkerGroupsEnabled({ platformId })
        if (workerGroupsEnabled) {
            if (!isNil(flowId)) {
                const flowGroupId = await flowWorkerGroupService(log).getFlowWorkerGroup({ flowId })
                if (!isNil(flowGroupId)) {
                    return workerGroupQueues.getFlowGroupQueueName(flowGroupId)
                }
            }
            const projectGroupId = await projectWorkerGroupService(log).getProjectWorkerGroup({ projectId, platformId })
            if (!isNil(projectGroupId)) {
                return workerGroupQueues.getProjectGroupQueueName(projectGroupId)
            }
        }
    }
    if (!platformId) {
        return QueueName.WORKER_JOBS
    }
    const groupId = await platformWorkerGroupService(log).getWorkerGroupId({ platformId })
    if (isNil(groupId)) {
        return QueueName.WORKER_JOBS
    }
    return workerGroupQueues.getPlatformGroupQueueName(groupId)
}

const resolveQueueForWorker = (assignment: WorkerGroupAssignment | null): string => {
    if (isNil(assignment)) {
        return QueueName.WORKER_JOBS
    }
    switch (assignment.scope) {
        case WorkerGroupScope.FLOW:
            return workerGroupQueues.getFlowGroupQueueName(assignment.id)
        case WorkerGroupScope.PROJECT:
            return workerGroupQueues.getProjectGroupQueueName(assignment.id)
        case WorkerGroupScope.PLATFORM:
            return workerGroupQueues.getPlatformGroupQueueName(assignment.id)
    }
}

export const workerGroupRouting = {
    resolveQueueForJob,
    resolveQueueForWorker,
}

type ResolveQueueForJobParams = {
    platformId: string | null
    projectId?: string | null
    flowId?: string | null
    jobType?: WorkerJobType
    log: FastifyBaseLogger
}
