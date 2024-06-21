import { projectUsageService } from '../../project/usage/project-usage-service'
import { projectLimitsService } from './project-plan.service'
import { exceptionHandler, system } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ApEdition,
    ErrorCode,
    ProjectId,
} from '@activepieces/shared'


async function limit({ projectId }: { projectId: ProjectId }): Promise<void> {
    const edition = system.getEdition()

    if (![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
        return
    }

    try {
        const projectPlan = await projectLimitsService.getPlanByProjectId(projectId)
        if (!projectPlan) {
            return
        }
        const consumedTasks = await projectUsageService.increaseTasks(projectId, 0)
        if (consumedTasks > projectPlan.tasks) {
            throw new ActivepiecesError({
                code: ErrorCode.QUOTA_EXCEEDED,
                params: {
                    metric: 'tasks',
                    quota: projectPlan.tasks,
                },
            })
        }
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
