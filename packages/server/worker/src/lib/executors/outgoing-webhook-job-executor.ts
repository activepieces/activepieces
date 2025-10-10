import { OutgoingWebhookJobData } from '@activepieces/shared'
import axios from 'axios'
import { FastifyBaseLogger } from 'fastify'

export const outgoingWebhookExecutor = (log: FastifyBaseLogger) => ({
    async execute(jobId: string, jobData: OutgoingWebhookJobData): Promise<void> {
        const { webhookUrl, payload } = jobData
        log.info({
            jobId,
            jobData,
        }, 'Consuming outgoing webhook job')
        const timeout = 10000

        const response = await axios.post(webhookUrl, payload, {
            timeout: timeout,
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