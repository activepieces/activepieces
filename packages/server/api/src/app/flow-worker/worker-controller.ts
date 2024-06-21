import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { flowRunService } from '../flows/flow-run/flow-run-service'
import { dedupeService } from '../flows/trigger/dedupe'
import { generateEngineToken } from '../helper/engine-helper'
import { flowConsumer } from './consumer'
import { JobData, OneTimeJobData, PollJobRequest, QueueName, ResumeRunRequest, SubmitPayloadsRequest, UpdateJobRequest } from '@activepieces/server-shared'
import { apId, ExecutionType, PrincipalType, ProgressUpdateType, RunEnvironment } from '@activepieces/shared'

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
        const job = await flowConsumer.poll(queueName, request.principal.id)
        if (!job) {
            return null
        }
        return enrichEngineToken(queueName, job)
    })

    app.post('/update-job', {
        config: {
            allowedPrincipals: [PrincipalType.WORKER],
        },
        schema: {
            body: UpdateJobRequest,
        },
    }, async (request) => {
        const { id } = request.principal
        const { queueName, status, message } = request.body
        await flowConsumer.update({ jobId: id, queueName, status, message: message ?? 'NO_MESSAGE_AVAILABLE', token: 'WORKER' })
    })

    app.post('/submit-payloads', {
        config: {
            allowedPrincipals: [PrincipalType.WORKER],
        },
        schema: {
            body: SubmitPayloadsRequest,
        },
    }, async (request) => {
        const { flowVersionId, projectId, payloads, synchronousHandlerId } = request.body

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
                executionType: ExecutionType.BEGIN,
                progressUpdateType: ProgressUpdateType.NONE,
            }),
        )
        return Promise.all(createFlowRuns)
    })

    app.post('/resume', {
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
            environment: RunEnvironment.PRODUCTION,
            progressUpdateType: data.progressUpdateType,
        })
    })

}

async function enrichEngineToken(queueName: QueueName, job: { id: string, data: JobData }) {
    const engineToken = await generateEngineToken({
        jobId: job.id,
        projectId: queueName === QueueName.ONE_TIME ? (job.data as OneTimeJobData).projectId : apId(),
    })
    return {
        data: job.data,
        id: job.id,
        engineToken,
    }

}

