import { ApQueueJob, DelayedJobData, JobData, JobStatus, OneTimeJobData, PollJobRequest, QueueName, rejectedPromiseHandler, RepeatableJobType, ResumeRunRequest, SavePayloadRequest, ScheduledJobData, SendEngineUpdateRequest, SubmitPayloadsRequest, UserInteractionJobData, UserInteractionJobType, WebhookJobData } from '@activepieces/server-shared'
import { apId, ExecutionType, FlowRunStatus, FlowStatus, isNil, PrincipalType, ProgressUpdateType, RunEnvironment } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyBaseLogger } from 'fastify'
import { accessTokenManager } from '../authentication/lib/access-token-manager'
import { flowService } from '../flows/flow/flow.service'
import { flowRunService } from '../flows/flow-run/flow-run-service'
import { flowVersionService } from '../flows/flow-version/flow-version.service'
import { dedupeService } from '../flows/trigger/dedupe'
import { projectService } from '../project/project-service'
import { triggerEventService } from '../trigger/trigger-events/trigger-event.service'
import { triggerSourceService } from '../trigger/trigger-source/trigger-source-service'
import { flowConsumer } from './consumer'
import { engineResponseWatcher } from './engine-response-watcher'
import { jobQueue } from './queue'

export const flowWorkerController: FastifyPluginAsyncTypebox = async (app) => {

    app.get('/poll', {
        config: {
            allowedPrincipals: [PrincipalType.WORKER],
        },
        logLevel: 'silent',
        schema: {
            querystring: PollJobRequest,
        },
    }, async (request) => {

        const token = apId()
        const { queueName } = request.query
        const job = await flowConsumer(request.log).poll(queueName, {
            token,
        })
        if (!job) {
            return null
        }
        const runDeleted = await isRunDeletedForOneTimeJob(job, queueName, request.log) || await isRunDeletedForDelayedJob(job, queueName, request.log)
        if (runDeleted) {
            await flowConsumer(request.log).update({
                jobId: job.id,
                queueName,
                status: JobStatus.COMPLETED,
                token,
                message: 'Run deleted',
            })
            return null
        }
        const isStale = await isStaleFlow(job.data, queueName, request.log)
        if (isStale) {
            await flowConsumer(request.log).update({
                jobId: job.id,
                queueName,
                status: JobStatus.COMPLETED,
                token,
                message: 'Flow removed',
            })
            await removeScheduledJob(job.data as ScheduledJobData, request.log)
            return null
        }
        if (queueName === QueueName.ONE_TIME) {
            const { runId } = job.data as OneTimeJobData
            flowRunService(request.log).updateRunStatusAsync({
                flowRunId: runId,
                status: FlowRunStatus.RUNNING,
            })
        }
        return enrichEngineToken(token, queueName, job)
    })


    app.post('/send-engine-update', {
        config: {
            allowedPrincipals: [PrincipalType.WORKER],
        },
        schema: {
            body: SendEngineUpdateRequest,
        },
    }, async (request) => {
        const { workerServerId, requestId, response } = request.body
        await engineResponseWatcher(request.log).publish(requestId, workerServerId, response)
        return {}
    })
    app.post('/save-payloads', {
        config: {
            allowedPrincipals: [PrincipalType.WORKER],
        },
        schema: {
            body: SavePayloadRequest,
        },

    }, async (request) => {
        const { flowId, projectId, payloads } = request.body
        const savePayloads = payloads.map((payload) =>
            rejectedPromiseHandler(triggerEventService(request.log).saveEvent({
                flowId,
                payload,
                projectId,
            }), request.log),
        )
        rejectedPromiseHandler(Promise.all(savePayloads), request.log)
        await triggerSourceService(request.log).disable({
            flowId,
            projectId,
            simulate: true,
            ignoreError: true,
        })
        return {}
    })

    app.post('/submit-payloads', {
        config: {
            allowedPrincipals: [PrincipalType.WORKER],
        },
        schema: {
            body: SubmitPayloadsRequest,
        },
    }, async (request) => {
        const { flowVersionId, projectId, payloads, httpRequestId, synchronousHandlerId, progressUpdateType, environment, parentRunId, failParentOnFailure } = request.body

        const flowVersionExists = await flowVersionService(request.log).exists(flowVersionId)
        if (!flowVersionExists) {
            return []
        }
        const filterPayloads = await dedupeService.filterUniquePayloads(
            flowVersionId,
            payloads,
        )
        const createFlowRuns = filterPayloads.map((payload) =>{
            return  flowRunService(request.log).start({
                environment,
                flowVersionId,
                payload,
                synchronousHandlerId,
                projectId,
                httpRequestId,
                executionType: ExecutionType.BEGIN,
                progressUpdateType,
                executeTrigger: false,
                parentRunId,
                failParentOnFailure,
            })
        })
        return Promise.all(createFlowRuns)
    })

    app.post('/resume-run', {
        config: {
            allowedPrincipals: [PrincipalType.WORKER],
        },
        schema: {
            body: ResumeRunRequest,
        },
    }, async (request) => {
        const data = request.body
        const flowRun = await flowRunService(request.log).getOneOrThrow({
            id: data.runId,
            projectId: data.projectId,
        })
        await flowRunService(request.log).start({
            payload: null,
            existingFlowRunId: data.runId,
            executeTrigger: false,
            synchronousHandlerId: data.synchronousHandlerId ?? undefined,
            projectId: data.projectId,
            flowVersionId: data.flowVersionId,
            executionType: ExecutionType.RESUME,
            httpRequestId: data.httpRequestId,
            environment: RunEnvironment.PRODUCTION,
            progressUpdateType: data.progressUpdateType ?? ProgressUpdateType.NONE,
            parentRunId: flowRun.parentRunId,
            failParentOnFailure: flowRun.failParentOnFailure,
        })
    })

}


async function isRunDeletedForDelayedJob(
    job: Omit<ApQueueJob, 'engineToken'>,
    queueName: QueueName,
    log: FastifyBaseLogger,
): Promise<boolean> {
    if (queueName !== QueueName.SCHEDULED) {
        return false
    }
    const scheduledJob = job.data as ScheduledJobData | DelayedJobData
    if (scheduledJob.jobType !== RepeatableJobType.DELAYED_FLOW) {
        return false
    }
    const { runId } = scheduledJob

    const runExists = await flowRunService(log).existsBy(runId)
    return !runExists

}

async function isRunDeletedForOneTimeJob(
    job: Omit<ApQueueJob, 'engineToken'>,
    queueName: QueueName,
    log: FastifyBaseLogger,
): Promise<boolean> {
    if (queueName !== QueueName.ONE_TIME) {
        return false
    }

    const skipDeletionCheckForFirstAttemptExecutionSpeed = job.attempsStarted === 0
    if (skipDeletionCheckForFirstAttemptExecutionSpeed) {
        return false
    }

    const { runId } = job.data as OneTimeJobData

    const runExists = await flowRunService(log).existsBy(runId)
    return !runExists
}

async function isStaleFlow(job: JobData, queueName: QueueName, log: FastifyBaseLogger): Promise<boolean> {
    if (queueName !== QueueName.SCHEDULED) {
        return false
    }
    const scheduledJob = job as ScheduledJobData | DelayedJobData
    const flowVersion = await flowVersionService(log).getOne(scheduledJob.flowVersionId)
    if (isNil(flowVersion)) {
        return true
    }
    const flow = await flowService(log).getOneById(flowVersion.flowId)
    if (isNil(flow)) {
        return true
    }
    return flow.status === FlowStatus.DISABLED || flow?.publishedVersionId !== scheduledJob.flowVersionId
}


async function removeScheduledJob(job: ScheduledJobData, log: FastifyBaseLogger) {
    log.info({
        message: '[WorkerController#removeScheduledJob]',
        flowVersionId: job.flowVersionId,
    }, 'removing stale scheduled job')
    await jobQueue(log).removeRepeatingJob({
        flowVersionId: job.flowVersionId,
    })
    const flowVersion = await flowVersionService(log).getOne(job.flowVersionId)
    if (isNil(flowVersion)) {
        return
    }
    await triggerSourceService(log).disable({
        projectId: job.projectId,
        flowId: flowVersion.flowId,
        simulate: false,
        ignoreError: true,
    })
}

async function enrichEngineToken(token: string, queueName: QueueName, job: { id: string, data: JobData, attempsStarted: number }) {
    const { projectId, platformId } = await getProjectIdAndPlatformId(queueName, job.data)
    const engineToken = await accessTokenManager.generateEngineToken({
        jobId: job.id,
        queueToken: token,
        projectId,
        platformId,
    })
    return {
        data: job.data,
        id: job.id,
        engineToken,
        attempsStarted: job.attempsStarted,
    }
}

async function getProjectIdAndPlatformId(queueName: QueueName, job: JobData): Promise<{
    projectId: string
    platformId: string
}> {
    switch (queueName) {
        case QueueName.AGENTS:
        case QueueName.ONE_TIME:
        case QueueName.WEBHOOK:
        case QueueName.SCHEDULED: {
            const castedJob = job as OneTimeJobData | WebhookJobData | ScheduledJobData
            return {
                projectId: castedJob.projectId,
                platformId: await projectService.getPlatformId(castedJob.projectId),
            }
        }
        case QueueName.USERS_INTERACTION: {
            const userInteractionJob = job as UserInteractionJobData
            switch (userInteractionJob.jobType) {
                case UserInteractionJobType.EXECUTE_VALIDATION:
                case UserInteractionJobType.EXECUTE_EXTRACT_PIECE_INFORMATION:
                    return {
                        projectId: userInteractionJob.projectId!,
                        platformId: userInteractionJob.platformId,
                    }
                default:
                    return {
                        projectId: userInteractionJob.projectId,
                        platformId: await projectService.getPlatformId(userInteractionJob.projectId),
                    }
            }
        }
    }
}
