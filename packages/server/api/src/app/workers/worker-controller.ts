import { DeleteWebhookSimulationRequest, JobData, OneTimeJobData, PollJobRequest, QueueName, rejectedPromiseHandler, ResumeRunRequest, SavePayloadRequest, ScheduledJobData, SendWebhookUpdateRequest, SubmitPayloadsRequest, WebhookJobData } from '@activepieces/server-shared'
import { apId, ExecutionType, PrincipalType, RunEnvironment } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { flowService } from '../flows/flow/flow.service'
import { flowRunService } from '../flows/flow-run/flow-run-service'
import { dedupeService } from '../flows/trigger/dedupe'
import { triggerEventService } from '../flows/trigger-events/trigger-event.service'
import { generateEngineToken } from '../helper/engine-helper'
import { webhookSimulationService } from '../webhooks/webhook-simulation/webhook-simulation-service'
import { flowConsumer } from './consumer'
import { webhookResponseWatcher } from './helper/webhook-response-watcher'

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
        const { queueName } = request.query
        const job = await flowConsumer.poll(queueName)
        if (!job) {
            return null
        }
        return enrichEngineToken(queueName, job)
    })

    app.post('/delete-webhook-simulation', {
        config: {
            allowedPrincipals: [PrincipalType.WORKER],
        },
        schema: {
            body: DeleteWebhookSimulationRequest,
        },
    }, async (request) => {
        const { flowId, projectId } = request.body
        await webhookSimulationService.delete({ flowId, projectId })
    })

    app.post('/send-webhook-update', {
        config: {
            allowedPrincipals: [PrincipalType.WORKER],
        },
        schema: {
            body: SendWebhookUpdateRequest,
        },
    }, async (request) => {
        const { workerServerId, requestId, response } = request.body
        await webhookResponseWatcher.publish(requestId, workerServerId, response)
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
            rejectedPromiseHandler(triggerEventService.saveEvent({
                flowId,
                payload,
                projectId,
            })),
        )
        rejectedPromiseHandler(Promise.all(savePayloads))
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
        const { flowVersionId, projectId, payloads, httpRequestId, synchronousHandlerId, progressUpdateType } = request.body

        const filterPayloads = await dedupeService.filterUniquePayloads(
            flowVersionId,
            payloads,
        )
        const createFlowRuns = filterPayloads.map((payload) =>
            flowRunService.start({
                environment: RunEnvironment.PRODUCTION,
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
        await flowRunService.start({
            payload: null,
            flowRunId: data.runId,
            synchronousHandlerId: data.synchronousHandlerId ?? undefined,
            projectId: data.projectId,
            flowVersionId: data.flowVersionId,
            executionType: ExecutionType.RESUME,
            httpRequestId: data.httpRequestId,
            environment: RunEnvironment.PRODUCTION,
            progressUpdateType: data.progressUpdateType,
        })
    })

}

async function enrichEngineToken(queueName: QueueName, job: { id: string, data: JobData }) {
    const engineToken = await generateEngineToken({
        jobId: job.id,
        projectId: await getProjectId(queueName, job.data),
    })
    return {
        data: job.data,
        id: job.id,
        engineToken,
    }
}

async function getProjectId(queueName: QueueName, job: JobData) {
    switch (queueName) {
        case QueueName.ONE_TIME:
            return (job as OneTimeJobData).projectId
        case QueueName.WEBHOOK: {
            // TODO add project it to the webhook data
            const webhookData = (job as WebhookJobData)
            const flow = await flowService.getOneById(webhookData.flowId)
            return flow?.projectId ?? apId()
        }
        case QueueName.SCHEDULED:
            return (job as ScheduledJobData).projectId
    }
}
