import { isNil, ProjectId, tryCatch } from '@activepieces/core-utils'
import { apDayjs } from '@activepieces/server-utils'
import { AdminRetryRunsRequestBody, ApplyLicenseKeyByEmailRequestBody, FlowRetryStrategy, FlowRun, hasActiveSubscription, IncreaseAICreditsForPlatformRequestBody, Platform, PLATFORM_PURGE_DELAY_DAYS, PlatformRole } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { aiProviderService } from '../../../ai/ai-provider-service'
import { userIdentityService } from '../../../authentication/user-identity/user-identity-service'
import { flowRunRepo, flowRunService } from '../../../flows/flow-run/flow-run-service'
import { SystemJobName } from '../../../helper/system-jobs/common'
import { systemJobsSchedule } from '../../../helper/system-jobs/system-job'
import { billingProvider } from '../../../platform/billing-provider'
import { platformRepo } from '../../../platform/platform.service'
import { userRepo } from '../../../user/user-service'
import { openRouterApi } from '../platform-plan/openrouter/openrouter-api'
import { platformPlanService } from '../platform-plan/platform-plan.service'
import { beginPlatformTeardown } from '../platform-teardown-jobs'

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
        const platform = await getPlatformOwnedByEmail({ email, log })
        await billingProvider.get(log).activateLicense({
            platformId: platform.id,
            licenseKey,
        })
    },

    async deletePlatformsByEmail({ emails }: DeletePlatformsByEmailParams): Promise<DeletePlatformsByEmailResult[]> {
        const results: DeletePlatformsByEmailResult[] = []
        for (const email of emails) {
            const { data: platform, error } = await tryCatch(async () => getPlatformOwnedByEmail({ email, log }))
            if (isNil(platform)) {
                results.push({ email, platformId: null, deleted: false, reason: error?.message ?? 'Platform lookup failed' })
                continue
            }
            const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platform.id)
            if (hasActiveSubscription(platformPlan.plan)) {
                results.push({ email, platformId: platform.id, deleted: false, reason: 'Platform has an active subscription' })
                continue
            }
            await systemJobsSchedule(log).upsertJob({
                job: {
                    name: SystemJobName.HARD_DELETE_PLATFORM,
                    data: { platformId: platform.id },
                    jobId: `hard-delete-platform-${platform.id}`,
                },
                schedule: {
                    type: 'one-time',
                    date: apDayjs().add(PLATFORM_PURGE_DELAY_DAYS, 'day'),
                },
                customConfig: {
                    attempts: 25,
                    backoff: {
                        type: 'fixed',
                        delay: 60000,
                    },
                },
            })
            await beginPlatformTeardown({ platformId: platform.id, log })
            results.push({ email, platformId: platform.id, deleted: true, reason: null })
        }
        return results
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

async function getPlatformOwnedByEmail({ email, log }: GetPlatformOwnedByEmailParams): Promise<Platform> {
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
    return platform
}

type GetPlatformOwnedByEmailParams = {
    email: string
    log: FastifyBaseLogger
}

type DeletePlatformsByEmailParams = {
    emails: string[]
}

export type DeletePlatformsByEmailResult = {
    email: string
    platformId: string | null
    deleted: boolean
    reason: string | null
}
