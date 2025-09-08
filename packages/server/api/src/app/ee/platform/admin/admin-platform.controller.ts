import { StripePlanName } from '@activepieces/ee-shared'
import { AdminRetryRunsRequestBody, ApId, ApplyLicenseKeyByEmailRequestBody, FlowRunStatus, GiftTrialByEmailRequestBody, isNil, LATEST_JOB_DATA_SCHEMA_VERSION, PauseType, PrincipalType, ProgressUpdateType, WorkerJobType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import dayjs from 'dayjs'
import { flowRunRepo } from '../../../flows/flow-run/flow-run-service'
import { projectService } from '../../../project/project-service'
import { jobQueue } from '../../../workers/queue'
import { JobType } from '../../../workers/queue/queue-manager'
import { stripeHelper } from '../platform-plan/stripe-helper'
import { adminPlatformService } from './admin-platform.service'
import { fileRepo } from '../../../file/file.service'
import { s3Helper } from '../../../file/s3-helper'
import { FastifyBaseLogger } from 'fastify'

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

    app.post('/runs/:runId/refill-delayed', RefillDelayedRunRequest, async (req, res) => {
        const { runId } = req.params

        const flowRun = await flowRunRepo().findOneBy({ id: runId })
        if (!flowRun) {
            return res.status(StatusCodes.NOT_FOUND).send({ message: 'Flow run not found' })
        }

        if (flowRun.status !== FlowRunStatus.PAUSED) {
            return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Flow run is not paused' })
        }

        if (flowRun.pauseMetadata?.type !== PauseType.DELAY) {
            return res.status(StatusCodes.BAD_REQUEST).send({ message: 'Flow run is not a delayed run' })
        }

        const delayInMilliSeconds = dayjs(flowRun.pauseMetadata.resumeDateTime).diff(dayjs())
        const delay = delayInMilliSeconds < 0 ? 0 : delayInMilliSeconds

        const oldestLogFileId = await getOldestLogFile(flowRun.id, flowRun.projectId, req.log)

        if (oldestLogFileId) {
            await flowRunRepo().update(flowRun.id, { logsFileId: oldestLogFileId })
        }

        await jobQueue(req.log).add({
            id: 'delayed_' + flowRun.id,
            type: JobType.ONE_TIME,
            data: {
                projectId: flowRun.projectId,
                platformId: await projectService.getPlatformId(flowRun.projectId),
                environment: flowRun.environment,
                schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                flowVersionId: flowRun.flowVersionId,
                flowId: flowRun.flowId,
                runId: flowRun.id,
                httpRequestId: flowRun.pauseMetadata?.requestIdToReply ?? undefined,
                synchronousHandlerId: flowRun.pauseMetadata.handlerId ?? null,
                progressUpdateType: flowRun.pauseMetadata.progressUpdateType ?? ProgressUpdateType.NONE,
                jobType: WorkerJobType.DELAYED_FLOW,
            },
            delay,
        })

        return res.status(StatusCodes.OK).send({
            message: 'Delayed run added to queue successfully',
            logsFileId: oldestLogFileId,
        })
    })
}

async function getOldestLogFile(flowRunId: string, projectId: string, log: FastifyBaseLogger): Promise<string | null> {
    const files = await fileRepo()
        .createQueryBuilder('file')
        .where('file.projectId = :projectId', { projectId })
        .andWhere("file.metadata->>'flowRunId' = :flowRunId", { flowRunId })
        .orderBy('file.created', 'ASC')
        .getMany();

    for (const file of files) {
        if (file.s3Key && await s3Helper(log).exists(file.s3Key)) {
            return file.id
        }
    }
    return null
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

const RefillDelayedRunRequest = {
    schema: {
        params: Type.Object({
            runId: Type.String(),
        }),
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}