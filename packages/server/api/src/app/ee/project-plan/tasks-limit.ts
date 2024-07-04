import { exceptionHandler, system } from '@activepieces/server-shared'
import {
    ApEdition,
    ProjectId,
} from '@activepieces/shared'
import { projectUsageService } from '../../project/usage/project-usage-service'
import { projectLimitsService } from './project-plan.service'


async function exceededLimit({ projectId }: { projectId: ProjectId }): Promise<boolean> {
    const edition = system.getEdition()

    if (![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
        return false
    }

    try {
        const projectPlan = await projectLimitsService.getPlanByProjectId(projectId)
        if (!projectPlan) {
            return false
        }
        const consumedTasks = await projectUsageService.increaseTasks(projectId, 0)
        return consumedTasks >= projectPlan.tasks
    }
    catch (e) {
        exceptionHandler.handle(e)
        return false
    }
}

export const tasksLimit = {
    exceededLimit,
}
