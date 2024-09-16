import { exceptionHandler, system } from '@activepieces/server-shared'
import {
    ApEdition,
    ProjectId,
} from '@activepieces/shared'
import { projectUsageService } from '../../project/usage/project-usage-service'
import { projectLimitsService } from './project-plan.service'

async function exceededLimit({ projectId, tokensToConsume }: { projectId: ProjectId, tokensToConsume: number }): Promise<boolean> {
    const edition = system.getEdition()

    if (![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
        return false
    }

    try {
        const projectPlan = await projectLimitsService.getPlanByProjectId(projectId)
        if (!projectPlan) {
            return false
        }
        const consumedTokens = await projectUsageService.increaseUsage(projectId, tokensToConsume, 'aiTokens')
        return consumedTokens > projectPlan.aiTokens
    }
    catch (e) {
        exceptionHandler.handle(e)
        return false
    }
}

export const aiTokenLimit = {
    exceededLimit,
}