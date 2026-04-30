import { safeHttp } from '@activepieces/server-utils'
import {
    EngineResponseStatus,
    EventDestinationJobData,
    WorkerJobType,
} from '@activepieces/shared'
import { workerSettings } from '../../config/worker-settings'
import { FireAndForgetJobResult, JobContext, JobHandler, JobResultKind } from '../types'

export const eventDestinationJob: JobHandler<EventDestinationJobData, FireAndForgetJobResult> = {
    jobType: WorkerJobType.EVENT_DESTINATION,
    async execute(ctx: JobContext, data: EventDestinationJobData): Promise<FireAndForgetJobResult> {
        const timeoutInSeconds = workerSettings.getSettings().EVENT_DESTINATION_TIMEOUT_SECONDS

        ctx.log.info({ webhookUrl: data.webhookUrl, webhookId: data.webhookId }, 'Sending event destination')

        const response = await safeHttp.axios.request({
            url: data.webhookUrl,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            data: data.payload,
            timeout: timeoutInSeconds * 1000,
            validateStatus: () => true,
        })

        ctx.log.info({ webhookUrl: data.webhookUrl, status: response.status }, 'Event destination sent')

        return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
    },
}
