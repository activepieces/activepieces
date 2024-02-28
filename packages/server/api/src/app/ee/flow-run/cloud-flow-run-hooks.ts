import { ApEdition } from '@activepieces/shared'
import { FlowRunHooks } from '../../flows/flow-run/flow-run-hooks'
import { getEdition } from '../../helper/secret-helper'
import { tasksLimit } from '../project-plan/tasks-limit'
import { projectUsageService } from '../../project/usage/project-usage-service'

export const platformRunHooks: FlowRunHooks = {
    async onPreStart({ projectId }: { projectId: string }): Promise<void> {
        await tasksLimit.limit({
            projectId,
        })
    },
    async onFinish({
        projectId,
        tasks,
    }: {
        projectId: string
        tasks: number
    }): Promise<void> {
        const edition = getEdition()
        if ([ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
            await projectUsageService.increaseTasks(
                projectId,
                tasks,
            )
        }
    },
}