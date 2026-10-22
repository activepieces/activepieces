import { isNil } from '@activepieces/core-utils'
import { WorkerGroupScope, WorkerJobType } from '@activepieces/shared'

const parseWorkerGroupValue = ({ value, scope }: ParseWorkerGroupValueParams): WorkerGroupAssignment | null => {
    if (isNil(value) || value.length === 0) {
        return null
    }
    return {
        scope,
        id: value,
    }
}

const resolveScope = ({ projectWorker, scope }: ResolveScopeParams): WorkerGroupScope => {
    const explicitScope = Object.values(WorkerGroupScope).find((knownScope) => knownScope === scope)
    if (!isNil(explicitScope)) {
        return explicitScope
    }
    return projectWorker ? WorkerGroupScope.PROJECT : WorkerGroupScope.PLATFORM
}

const getQueueName = ({ scope, workerGroupId }: GetQueueNameParams): string => {
    switch (scope) {
        case WorkerGroupScope.FLOW:
            return `flow-${workerGroupId}-jobs`
        case WorkerGroupScope.PROJECT:
            return `project-${workerGroupId}-jobs`
        case WorkerGroupScope.PLATFORM:
            // TODO Rename this to workerGroups-workerGroupId-jobs in the future and migrate existings jobs there.
            return `platform-${workerGroupId}-jobs`
    }
}

const isRoutableWorkerGroupId = (value: string): boolean => {
    return value.length > 0 && value !== NO_WORKER_GROUP_SENTINEL && !value.includes(':')
}

export const workerGroupQueues = {
    parseWorkerGroupValue,
    resolveScope,
    getQueueName,
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
    scope: WorkerGroupScope
}

type ResolveScopeParams = {
    projectWorker: boolean
    scope: string | undefined
}

type GetQueueNameParams = {
    scope: WorkerGroupScope
    workerGroupId: string
}
