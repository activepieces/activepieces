import { isNil } from '@activepieces/core-utils'
import { WorkerGroupScope, WorkerJobType } from '@activepieces/shared'

const parseWorkerGroupValue = ({ value, projectWorker, scope }: ParseWorkerGroupValueParams): WorkerGroupAssignment | null => {
    if (isNil(value) || value.length === 0) {
        return null
    }
    return {
        scope: resolveScope({ projectWorker, scope }),
        id: value,
    }
}

const resolveScope = ({ projectWorker, scope }: { projectWorker: boolean, scope: string | undefined }): WorkerGroupScope => {
    const explicitScope = Object.values(WorkerGroupScope).find((knownScope) => knownScope === scope)
    if (!isNil(explicitScope)) {
        return explicitScope
    }
    return projectWorker ? WorkerGroupScope.PROJECT : WorkerGroupScope.PLATFORM
}

const getPlatformGroupQueueName = (workerGroupId: string): string => {
    // TODO Rename this to workerGroups-workerGroupId-jobs in the future and migrate existings jobs there.
    return `platform-${workerGroupId}-jobs`
}

const getProjectGroupQueueName = (workerGroupId: string): string => {
    return `project-${workerGroupId}-jobs`
}

const getFlowGroupQueueName = (workerGroupId: string): string => {
    return `flow-${workerGroupId}-jobs`
}

const isRoutableWorkerGroupId = (value: string): boolean => {
    return value.length > 0 && value !== NO_WORKER_GROUP_SENTINEL
}

export const workerGroupQueues = {
    parseWorkerGroupValue,
    getPlatformGroupQueueName,
    getProjectGroupQueueName,
    getFlowGroupQueueName,
    isRoutableWorkerGroupId,
}

export const NO_WORKER_GROUP_SENTINEL = '__none__'

export const PROJECT_GROUP_ROUTABLE_JOB_TYPES = new Set<WorkerJobType>([
    WorkerJobType.EXECUTE_FLOW,
    WorkerJobType.EXECUTE_WEBHOOK,
])

export type WorkerGroupAssignment = {
    scope: WorkerGroupScope
    id: string
}

type ParseWorkerGroupValueParams = {
    value: string | undefined
    projectWorker: boolean
    scope: string | undefined
}
