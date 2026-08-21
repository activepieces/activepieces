import { isNil, ProjectId } from '@activepieces/core-utils'
import { AdminRetryRunsRequestBody, ApplyLicenseKeyByEmailRequestBody, FlowRetryStrategy, FlowRun, IncreaseAICreditsForPlatformRequestBody, PlatformRole } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { aiProviderService } from '../../../ai/ai-provider-service'
import { userIdentityService } from '../../../authentication/user-identity/user-identity-service'
import { flowRunRepo, flowRunService } from '../../../flows/flow-run/flow-run-service'
import { billingProvider } from '../../../platform/billing-provider'
import { platformRepo } from '../../../platform/platform.service'
import { userRepo } from '../../../user/user-service'
import { openRouterApi } from '../platform-plan/openrouter/openrouter-api'

export const adminPlatformService = (log: FastifyBaseLogger) => ({

    retryRuns: async ({
        createdAfter,
        createdBefore,
        runIds,
    }: AdminRetryRunsRequestBody): Promise<void> => {
        const strategy = FlowRetryStrategy.FROM_FAILED_STEP

        let query = flowRunRepo().createQueryBuilder('flow_run').where({
            id: In(runIds ?? []),
        })
        if (!createdBefore) {
            query = query.andWhere('flow_run.created <= :createdBefore', {
                createdBefore,
            })
        }
        if (!createdAfter) {
            query = query.andWhere('flow_run.created >= :createdAfter', {
                createdAfter,
            })
        }

        const flowRuns = await query.getMany()
        const flowRunsByProject = flowRuns.reduce((acc, flowRun) => {
            acc[flowRun.projectId] = acc[flowRun.projectId] || []
            acc[flowRun.projectId].push(flowRun)
            return acc
        }, {} as Record<ProjectId, FlowRun[]>)
        for (const projectId in flowRunsByProject) {
            const flowRuns = flowRunsByProject[projectId]
            await flowRunService(log).bulkRetry({
                projectId,
                flowRunIds: flowRuns.map((flowRun) => flowRun.id),
                strategy,
            })
        }
    },

    async applyLicenseKeyByEmail({ email, licenseKey }: ApplyLicenseKeyByEmailRequestBody): Promise<void> {
        const identity = await userIdentityService(log).getIdentityByEmail(email)
        if (isNil(identity)) {
            throw new Error('User identity not found for email')
        }
        const user = await userRepo().findOneBy({
            identityId: identity.id,
            platformRole: PlatformRole.ADMIN,
        })
        if (isNil(user)) {
            throw new Error('Platform admin user not found for email')
        }
        const platform = await platformRepo().findOneBy({
            ownerId: user.id,
        })
        if (isNil(platform)) {
            throw new Error('Platform not found for owner')
        }
        await billingProvider.get(log).activateLicense({
            platformId: platform.id,
            licenseKey,
        })
    },

    async increaseAiCredits({ amountInUsd, platformId }: IncreaseAICreditsForPlatformRequestBody): Promise<void> {
        const { apiKeyHash } = await aiProviderService(log).getOrCreateActivePiecesProviderAuthConfig(platformId)
        const { data: key } = await openRouterApi.getKey({ hash: apiKeyHash })

        await openRouterApi.updateKey({
            hash: apiKeyHash,
            limit: key.limit! + amountInUsd,
        })
    },

})
