import {
    AdminRetryRunsRequestBody,
    ApplyLicenseKeyByEmailRequestBody,
    FileType,
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
import { fileRepo } from '../../../file/file.service'

export const adminPlatformService = (log: FastifyBaseLogger) => ({


    retryRuns: async ({
        runIds,
    }: AdminRetryRunsRequestBody): Promise<void> => {
        const strategy = FlowRetryStrategy.FROM_FAILED_STEP

        let query = flowRunRepo().createQueryBuilder('flow_run').where({
            status: In([FlowRunStatus.INTERNAL_ERROR, FlowRunStatus.QUEUED]),
            id: In(runIds ?? []),
        })


        const flowRuns = await query.getMany()
        for (const flowRun of flowRuns) {
            const file = await fileRepo().createQueryBuilder('file')
                .where('"file"."projectId" = :projectId', { projectId: flowRun.projectId })
                .andWhere('"file"."type" = :type', { type: FileType.FLOW_RUN_LOG })
                .andWhere(`"file"."metadata"->>'flowRunId' = :flowRunId`, { flowRunId: flowRun.id })
                .getOne()
            if (isNil(file)) {
                throw new Error('File not found for flow run')
            }
            await flowRunRepo().update(flowRun.id, {
                logsFileId: file.id,
            })
        }
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
