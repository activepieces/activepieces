import { StripePlanName } from '@activepieces/ee-shared'
import { apDayjs } from '@activepieces/server-shared'
import { AdminRetryRunsRequestBody, apId, ApplyLicenseKeyByEmailRequestBody, ExecutionType, FlowRunStatus, GiftTrialByEmailRequestBody, isNil, LATEST_JOB_DATA_SCHEMA_VERSION, PauseType, PrincipalType, ProgressUpdateType, UploadLogsBehavior, WorkerJobType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { StatusCodes } from 'http-status-codes'
import { flowRunRepo } from '../../../flows/flow-run/flow-run-service'
import { flowRunLogsService } from '../../../flows/flow-run/logs/flow-run-logs-service'
import { projectService } from '../../../project/project-service'
import { jobQueue } from '../../../workers/queue/job-queue'
import { JobType } from '../../../workers/queue/queue-manager'
import { stripeHelper } from '../platform-plan/stripe-helper'
import { adminPlatformService } from './admin-platform.service'

export const adminPlatformModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(adminPlatformController, { prefix: '/v1/admin/platforms' })
}

const adminPlatformController: FastifyPluginAsyncTypebox = async (
    app,
) => {

    app.post('/runs/retry', AdminRetryRunsRequest, async (req, res) => {
        await adminPlatformService(req.log).retryRuns(req.body)
        return res.status(StatusCodes.OK).send()
    })

    app.post('/apply-license-key', ApplyLicenseKeyByEmailRequest, async (req, res) => {
        await adminPlatformService(req.log).applyLicenseKeyByEmail(req.body)
        return res.status(StatusCodes.OK).send()
    })

    app.post('/retry-paused-runs', RetryPausedRuns, async (req, res) => {

        for (const id of req.body.ids) {
            const pausedRun = await flowRunRepo().findOneBy({ id, status: FlowRunStatus.PAUSED })
            if (isNil(pausedRun)) {
                throw new Error('Paused run not found')
            }
            if (pausedRun.pauseMetadata?.type !== PauseType.DELAY) {
                throw new Error('Paused run is not a delay pause')
            }
            const logsFileId = pausedRun.logsFileId ?? apId()
            const logsUploadUrl = await flowRunLogsService(req.log).constructUploadUrl({
                flowRunId: pausedRun.id,
                logsFileId,
                behavior: UploadLogsBehavior.UPLOAD_DIRECTLY,
                projectId: pausedRun.projectId,
            })
            await jobQueue(req.log).add({
                id: pausedRun.id,
                type: JobType.ONE_TIME,
                data: {
                    projectId: pausedRun.projectId,
                    platformId: await projectService.getPlatformId(pausedRun.projectId),
                    environment: pausedRun.environment,
                    schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                    flowId: pausedRun.flowId,
                    flowVersionId: pausedRun.flowVersionId,
                    runId: pausedRun.id,
                    httpRequestId: pausedRun.pauseMetadata?.requestIdToReply ?? undefined,
                    synchronousHandlerId: pausedRun.pauseMetadata?.handlerId ?? null,
                    progressUpdateType: pausedRun.pauseMetadata?.progressUpdateType ?? ProgressUpdateType.NONE,
                    jobType: WorkerJobType.EXECUTE_FLOW,
                    executionType: ExecutionType.RESUME,
                    payload: {},
                    logsUploadUrl,
                    logsFileId,
                },
                delay: calculateDelayForPausedRun(pausedRun.pauseMetadata?.resumeDateTime),
            })
        }
        return res.status(StatusCodes.OK).send()
    })

    app.post('/gift-trials', GiftTrialByEmailRequest, async (req, res) => {
        const { gifts } = req.body
        const results = await Promise.all(
            gifts.map(gift => stripeHelper(req.log).giftTrialForCustomer({ email: gift.email, trialPeriod: gift.trialPeriod, plan: gift.trialPlan as StripePlanName })),
        )

        const errors = results.filter(result => !isNil(result))
        if (errors.length === 0) {
            return res.status(StatusCodes.OK).send({ message: 'All gifts processed successfully' })
        }

        return res.status(StatusCodes.PARTIAL_CONTENT).send({ errors })
    })
}

const RetryPausedRuns = {
    schema: {
        body: Type.Object({
            ids: Type.Array(Type.String()),
        }),
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}

const AdminRetryRunsRequest = {
    schema: {
        body: AdminRetryRunsRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}

const ApplyLicenseKeyByEmailRequest = {
    schema: {
        body: ApplyLicenseKeyByEmailRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}

const GiftTrialByEmailRequest = {
    schema: {
        body: GiftTrialByEmailRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}

function calculateDelayForPausedRun(resumeDateTimeIsoString: string): number {
    const delayInMilliSeconds = apDayjs(resumeDateTimeIsoString).diff(apDayjs())
    return delayInMilliSeconds < 0 ? 0 : delayInMilliSeconds
}
