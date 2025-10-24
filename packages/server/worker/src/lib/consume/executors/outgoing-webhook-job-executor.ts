import { OutgoingWebhookJobData } from '@activepieces/shared'
import axios from 'axios'
import { FastifyBaseLogger } from 'fastify'

export const outgoingWebhookExecutor = (log: FastifyBaseLogger) => ({
    async execute(jobId: string, jobData: OutgoingWebhookJobData, timeoutInSeconds: number): Promise<void> {
        const { webhookUrl, payload } = jobData
        log.info({
            jobId,
            jobData,
        }, 'Consuming outgoing webhook job')

        const response = await axios.post(webhookUrl, payload, {
            timeout: timeoutInSeconds,
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