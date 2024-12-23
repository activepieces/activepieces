import { exceptionHandler } from '@activepieces/server-shared'
import {
    ApEdition,
    ProjectId,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../helper/system/system'
import { projectUsageService } from '../../project/usage/project-usage-service'
import { projectLimitsService } from './project-plan.service'

export const tasksLimit = (log: FastifyBaseLogger) => ({
    exceededLimit: async ({ projectId }: { projectId: ProjectId }): Promise<boolean> => {
        const edition = system.getEdition()

        if (![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
            return false
        }

        try {
            const projectPlan = await projectLimitsService.getPlanByProjectId(projectId)
            if (!projectPlan) {
                return false
            }
            const consumedTasks = await projectUsageService(log).increaseUsage(projectId, 0, 'tasks')
            return consumedTasks >= projectPlan.tasks
        }
        catch (e) {
            exceptionHandler.handle(e, log)
            return false
        }
    },
})
