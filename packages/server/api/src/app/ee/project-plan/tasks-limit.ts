import { flowRunHooks } from '../../flows/flow-run/flow-run-hooks'
import { getEdition } from '../../helper/secret-helper'
import { projectUsageService } from '../../project/usage/project-usage-service'
import { projectLimitsService } from './project-plan.service'
import { exceptionHandler } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ApEdition,
    ErrorCode,
    ProjectId,
} from '@activepieces/shared'

async function limit({ projectId }: { projectId: ProjectId }): Promise<void> {
    const edition = getEdition()

    if (![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
        return
    }

    try {
        const projectPlan = await projectLimitsService.getPlanByProjectId(projectId)
        if (!projectPlan) {
            return
        }
        const startBillingPeriod = projectUsageService.getCurrentingStartPeriod(projectPlan.created)
        const consumedTasks = await projectUsageService.getTasksUsage(projectPlan.projectId, startBillingPeriod)
        const previousUsage = await projectUsageService.getTasksUsage(projectPlan.projectId, startBillingPeriod, true)
        await flowRunHooks.getHooks().limitTasksPerMonth({
            consumedTasks,
            previousUsage,
            projectId: projectPlan.projectId,
            createdAt: projectPlan.created,
            tasks: projectPlan.tasks,
        })
    }
    catch (e) {
        if (
            e instanceof ActivepiecesError &&
            e.error.code === ErrorCode.QUOTA_EXCEEDED
        ) {
            throw e
        }
        else {
            // Ignore quota errors for sake of user experience and log them instead
            exceptionHandler.handle(e)
        }
    }
}

export const tasksLimit = {
    limit,
}
