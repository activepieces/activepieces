import { FlowWorkerHooks } from '../../workers/flow-worker/flow-worker-hooks'
import { tasksLimit } from '../billing/usage/limits/tasks-limit'

export const cloudFlowWorkerHooks: FlowWorkerHooks = {
    async preExecute({ projectId }: { projectId: string }): Promise<void> {
        await tasksLimit.limit({
            projectId,
        })
    },
}