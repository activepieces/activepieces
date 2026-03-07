import {
    EventDestinationJobData,
    WorkerJobType,
} from '@activepieces/shared'
import { workerSettings } from '../../config/worker-settings'
import { JobHandler, JobContext, JobResult } from '../types'

export const eventDestinationJob: JobHandler<EventDestinationJobData> = {
    jobType: WorkerJobType.EVENT_DESTINATION,
    async execute(ctx: JobContext, data: EventDestinationJobData): Promise<JobResult> {
        const settings = workerSettings.getSettings()
        const timeoutInSeconds = settings.EVENT_DESTINATION_TIMEOUT_SECONDS

        ctx.log.info({ webhookUrl: data.webhookUrl, webhookId: data.webhookId }, 'Sending event destination')

        const response = await fetch(data.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data.payload),
            signal: AbortSignal.timeout(timeoutInSeconds * 1000),
        })

        ctx.log.info({ webhookUrl: data.webhookUrl, status: response.status }, 'Event destination sent')

        return {}
    },
}
