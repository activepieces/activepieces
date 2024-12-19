import { exceptionHandler } from '@activepieces/server-shared'
import {
    ApEdition,
    ProjectId,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../helper/system/system'
import { projectUsageService } from '../../project/usage/project-usage-service'
import { projectLimitsService } from './project-plan.service'

export const aiTokenLimit = (log: FastifyBaseLogger) => ({
    exceededLimit: async ({ projectId, tokensToConsume }: { projectId: ProjectId, tokensToConsume: number }): Promise<{ exceeded: false } | { exceeded: true, usage: number, limit: number }> => {
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
            const consumedTokens = await projectUsageService(log).increaseUsage(projectId, tokensToConsume, 'aiTokens')
            return {
                exceeded: consumedTokens > projectPlan.aiTokens,
                usage: consumedTokens,
                limit: projectPlan.aiTokens,
            }
        }
        catch (e) {
            exceptionHandler.handle(e, log)
            throw e
        }
    },
})