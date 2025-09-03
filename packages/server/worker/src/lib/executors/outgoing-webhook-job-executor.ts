import { OutgoingWebhookJobData } from '@activepieces/server-shared'
import axios from 'axios'
import { FastifyBaseLogger } from 'fastify'
import { workerMachine } from '../utils/machine'

export const outgoingWebhookExecutor = (log: FastifyBaseLogger) => ({
    async consumeOutgoingWebhook(jobId: string, jobData: OutgoingWebhookJobData): Promise<void> {
        const { url, payload } = jobData
        log.info({
            jobId,
            jobData,
        }, 'Consuming outgoing webhook job')
        const timeoutOutgoingWebhookInSeconds = workerMachine.getSettings().OUTGOING_WEBHOOK_TIMEOUT_SECONDS * 1000

        const response = await axios.post(url, payload, {
            timeout: timeoutOutgoingWebhookInSeconds,
        })

        log.info({
            jobId,
            response: {
                status: response.status,
                data: response.data,
            },
        }, 'Outgoing webhook job consumed')
    },
})
