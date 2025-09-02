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
        const response = await axios.post(url, payload)

        log.info({
            jobId,
            response: response.data,
        }, 'Outgoing webhook job consumed')
    },
})
