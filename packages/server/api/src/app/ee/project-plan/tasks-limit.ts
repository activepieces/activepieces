import { getEdition } from '../../helper/secret-helper'
import { projectUsageService } from '../../project/usage/project-usage-service'
import { emailService } from '../helper/email/email-service'
import { projectLimitsService } from './project-plan.service'
import { exceptionHandler } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ApEdition,
    ErrorCode,
    ProjectId,
    ProjectPlan,
} from '@activepieces/shared'


async function limitTasksPerMonth({
    projectPlan,
    consumedTasks,
}: {
    projectPlan: ProjectPlan
    consumedTasks: number
}): Promise<void> {
    const resetDate = projectUsageService.getCurrentingEndPeriod(projectPlan.created)
    const quotaAlerts: { limit: number, templateName: 'quota-50' | 'quota-90' | 'quota-100' }[] = [
        { limit: 0.5, templateName: 'quota-50' },
        { limit: 0.9, templateName: 'quota-90' },
        { limit: 1.0, templateName: 'quota-100' },
    ]
    
    for (const { limit, templateName } of quotaAlerts) {
        if (consumedTasks > projectPlan.tasks * limit) {
            await emailService.sendQuotaAlert({
                resetDate,
                templateName,
                projectId: projectPlan.projectId,
            })
        }
        
        if (limit === 1.0) {
            throw new ActivepiecesError({
                code: ErrorCode.QUOTA_EXCEEDED,
                params: {
                    metric: 'tasks',
                    quota: projectPlan.tasks,
                },
            })
        }
    }
}

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
        const consumedTasks = await projectUsageService.increaseTasks(projectId, 0)
        await limitTasksPerMonth({
            consumedTasks,
            projectPlan,
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
