import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { generateEngineToken } from '../helper/engine-helper'
import { flowConsumer } from './consumer'
import { JobData, OneTimeJobData, PollJobRequest, QueueName, UpdateJobRequest } from '@activepieces/server-shared'
import { ALL_PRINCIPAL_TYPES, apId, PrincipalType } from '@activepieces/shared'


export const flowWorkerController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/poll', {
        config: {
            // TODO URGENT FIX
            allowedPrincipals: ALL_PRINCIPAL_TYPES,
        },
        logLevel: 'silent',
        schema: {
            querystring: PollJobRequest,
        },
    }, async (request) => {
        const { queueName } = request.query
        const job = await flowConsumer.poll(queueName, 'WORKER')
        if (!job) {
            return null
        }
        return enrichEngineToken(queueName, job)
    })

    app.post('/update', {
        config: {
            allowedPrincipals: [PrincipalType.ENGINE],
        },
        schema: {
            body: UpdateJobRequest,
        },
    }, async (request) => {
        const { id } = request.principal
        const { queueName, status, message } = request.body
        await flowConsumer.update({ jobId: id, queueName, status, message: message ?? 'NO_MESSAGE_AVAILABLE', token: 'WORKER' })
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
