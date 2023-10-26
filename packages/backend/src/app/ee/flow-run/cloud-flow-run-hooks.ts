import { ApEdition } from '@activepieces/shared'
import { FlowRunHooks } from '../../flows/flow-run/flow-run-hooks'
import { getEdition } from '../../helper/secret-helper'
import { tasksLimit } from '../billing/usage/limits/tasks-limit'
import { usageService } from '../billing/usage/usage-service'

export const cloudRunHooks: FlowRunHooks = {
    async onPreStart({ projectId }: { projectId: string }): Promise<void> {
        await tasksLimit.limit({
            projectId,
        })
    },
    async onFinish({ projectId, tasks }: { projectId: string, tasks: number }): Promise<void> {
        const edition = getEdition()
        if (edition === ApEdition.CLOUD) {
            await usageService.addTasksConsumed({
                projectId,
                tasks,
            })
        }
    },
}