import { FlowRunHooks } from '../../flows/flow-run/flow-run-hooks'
import { tasksLimit } from '../project-plan/tasks-limit'

export const platformRunHooks: FlowRunHooks = {
    async onPreStart({ projectId }: { projectId: string }): Promise<void> {
        await tasksLimit.limit({
            projectId,
        })
    },
}
