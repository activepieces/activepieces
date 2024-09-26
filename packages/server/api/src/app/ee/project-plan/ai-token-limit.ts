import { exceptionHandler, system } from '@activepieces/server-shared'
import {
    ApEdition,
    ProjectId,
} from '@activepieces/shared'
import { projectUsageService } from '../../project/usage/project-usage-service'
import { projectLimitsService } from './project-plan.service'

type LimitExceededResponse = {
    exceeded: false
} | {
    exceeded: true
    usage: number
    limit: number
}
async function exceededLimit({ projectId, tokensToConsume }: { projectId: ProjectId, tokensToConsume: number }): Promise<LimitExceededResponse> {

    const edition = system.getEdition()

    if (![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
        return {
            exceeded: false,
        }
    }

    try {
        const projectPlan = await projectLimitsService.getPlanByProjectId(projectId)
        if (!projectPlan) {
            return {
                exceeded: false,
            }
        }
        const consumedTokens = await projectUsageService.increaseUsage(projectId, tokensToConsume, 'aiTokens')
        return {
            exceeded: consumedTokens > projectPlan.aiTokens,
            usage: consumedTokens,
            limit: projectPlan.aiTokens,
        }
    }
    catch (e) {
        exceptionHandler.handle(e)
        throw e
    }
}

export const aiTokenLimit = {
    exceededLimit,
}