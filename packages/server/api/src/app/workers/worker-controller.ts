import { JobData, OneTimeJobData, PollJobRequest, QueueName, rejectedPromiseHandler, ResumeRunRequest, SavePayloadRequest, ScheduledJobData, SendEngineUpdateRequest, SubmitPayloadsRequest, UserInteractionJobData, UserInteractionJobType, WebhookJobData } from '@activepieces/server-shared'
import { apId, ExecutionType, PrincipalType, ProgressUpdateType, RunEnvironment } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { accessTokenManager } from '../authentication/lib/access-token-manager'
import { flowRunService } from '../flows/flow-run/flow-run-service'
import { dedupeService } from '../flows/trigger/dedupe'
import { triggerEventService } from '../flows/trigger-events/trigger-event.service'
import { projectService } from '../project/project-service'
import { webhookSimulationService } from '../webhooks/webhook-simulation/webhook-simulation-service'
import { flowConsumer } from './consumer'
import { engineResponseWatcher } from './engine-response-watcher'

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
        await webhookSimulationService(request.log).delete({ flowId, projectId })
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
        const { flowVersionId, projectId, payloads, httpRequestId, synchronousHandlerId, progressUpdateType, environment } = request.body

        const filterPayloads = await dedupeService.filterUniquePayloads(
            flowVersionId,
            payloads,
        )
        const createFlowRuns = filterPayloads.map((payload) =>
            flowRunService(request.log).start({
                environment,
                flowVersionId,
                payload,
                synchronousHandlerId,
                projectId,
                httpRequestId,
                executionType: ExecutionType.BEGIN,
                progressUpdateType,
            }),
        )
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
        await flowRunService(request.log).start({
            payload: null,
            flowRunId: data.runId,
            synchronousHandlerId: data.synchronousHandlerId ?? undefined,
            projectId: data.projectId,
            flowVersionId: data.flowVersionId,
            executionType: ExecutionType.RESUME,
            httpRequestId: data.httpRequestId,
            environment: RunEnvironment.PRODUCTION,
            progressUpdateType: data.progressUpdateType ?? ProgressUpdateType.NONE,
        })
    })

}


async function enrichEngineToken(token: string, queueName: QueueName, job: { id: string, data: JobData }) {
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
    }
}

async function getProjectIdAndPlatformId(queueName: QueueName, job: JobData): Promise<{
    projectId: string
    platformId: string
}> {
    switch (queueName) {
        case QueueName.ONE_TIME:
        case QueueName.WEBHOOK: 
        case QueueName.SCHEDULED:{ 
            const castedJob = job as OneTimeJobData | WebhookJobData | ScheduledJobData
            return {
                projectId: castedJob.projectId,
                platformId: await projectService.getPlatformId(castedJob.projectId),
            }
        }
        case QueueName.USERS_INTERACTION:{
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
