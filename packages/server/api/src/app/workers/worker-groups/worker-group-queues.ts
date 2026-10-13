import { isNil } from '@activepieces/core-utils'
import { WorkerGroupScope, WorkerJobType } from '@activepieces/shared'

const parseWorkerGroupValue = ({ value, projectWorker }: { value: string | undefined, projectWorker: boolean }): WorkerGroupAssignment | null => {
    if (isNil(value) || value.length === 0) {
        return null
    }
    return {
        scope: projectWorker ? WorkerGroupScope.PROJECT : WorkerGroupScope.PLATFORM,
        id: value,
    }
}

const getPlatformGroupQueueName = (workerGroupId: string): string => {
    // TODO Rename this to workerGroups-workerGroupId-jobs in the future and migrate existings jobs there.
    return `platform-${workerGroupId}-jobs`
}

const getProjectGroupQueueName = (workerGroupId: string): string => {
    return `project-${workerGroupId}-jobs`
}

export const workerGroupQueues = {
    parseWorkerGroupValue,
    getPlatformGroupQueueName,
    getProjectGroupQueueName,
}

export const PROJECT_GROUP_ROUTABLE_JOB_TYPES = new Set<WorkerJobType>([
    WorkerJobType.EXECUTE_FLOW,
    WorkerJobType.EXECUTE_WEBHOOK,
])

export type WorkerGroupAssignment = {
    scope: WorkerGroupScope
    id: string
}
