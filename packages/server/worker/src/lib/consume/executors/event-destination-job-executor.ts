import { EventDestinationJobData } from '@activepieces/shared'
import axios from 'axios'
import { FastifyBaseLogger } from 'fastify'

export const eventDestinationExecutor = (log: FastifyBaseLogger) => ({
    async execute(jobId: string, jobData: EventDestinationJobData, timeoutInSeconds: number): Promise<void> {
        const { webhookUrl, payload } = jobData

        log.info({
            jobId,
            webhookUrl,
        }, 'Consuming event destination job')

        const response = await axios.post(webhookUrl, payload, {
            timeout: timeoutInSeconds * 1000,
        })

        log.info({
            jobId,
            response: {
                status: response.status,
            },
        }, 'Event destination job consumed')
    },
})