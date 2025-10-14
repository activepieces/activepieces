import {
    ActivepiecesError,
    AdminRetryRunsRequestBody,
    ApplyLicenseKeyByEmailRequestBody,
    ErrorCode,
    FlowRetryStrategy,
    FlowRun,
    FlowRunStatus,
    isNil,
    PlatformRole,
    ProjectId,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { userIdentityService } from '../../../authentication/user-identity/user-identity-service'
import { flowRunRepo, flowRunService } from '../../../flows/flow-run/flow-run-service'
import { platformRepo } from '../../../platform/platform.service'
import { userRepo } from '../../../user/user-service'
import { licenseKeysService } from '../../license-keys/license-keys-service'

export const adminPlatformService = (log: FastifyBaseLogger) => ({


    retryRuns: async ({
        createdAfter,
        createdBefore,
        runIds,
    }: AdminRetryRunsRequestBody): Promise<void> => {
        const strategy = FlowRetryStrategy.FROM_FAILED_STEP

        let query = flowRunRepo().createQueryBuilder('flow_run').where({
            status: In([FlowRunStatus.INTERNAL_ERROR]),
        })
        if (!isNil(runIds)) {
            query = query.andWhere({
                id: In(runIds),
            })
        }
        if (!createdAfter || !createdBefore) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'createdAfter and createdBefore are required',
                },
            })
        }
        query = query.andWhere('flow_run.created >= :createdAfter', {
            createdAfter,
        })
        query = query.andWhere('flow_run.created <= :createdBefore', {
            createdBefore,
        })

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
        if (!identity) {
            throw new Error('User identity not found for email')
        }
        const user = await userRepo().findOneBy({
            identityId: identity.id,
            platformRole: PlatformRole.ADMIN,
        })
        if (!user) {
            throw new Error('User not found for identityId')
        }
        const platform = await platformRepo().findOneBy({
            ownerId: user.id,
        })
        if (!platform) {
            throw new Error('Platform not found for owner')
        }
        const key = await licenseKeysService(log).verifyKeyOrReturnNull({ platformId: platform.id, license: licenseKey })
        if (!key) {
            throw new Error('Invalid or expired license key')
        }
        await licenseKeysService(log).applyLimits(platform.id, key)
    },

})
