import { tryCatch } from '@activepieces/core-utils'
import { safeHttp } from '@activepieces/server-utils'
import { EngineResponseStatus, EventDestinationJobData, WorkerJobType } from '@activepieces/shared'
import { workerSettings } from '../../config/worker-settings'
import { FireAndForgetJobResult, JobContext, JobHandler, JobResultKind } from '../types'

export const eventDestinationJob: JobHandler<EventDestinationJobData, FireAndForgetJobResult> = {
    jobType: WorkerJobType.EVENT_DESTINATION,
    async execute(ctx: JobContext, data: EventDestinationJobData): Promise<FireAndForgetJobResult> {
        const timeoutInSeconds = workerSettings.getSettings().EVENT_DESTINATION_TIMEOUT_SECONDS

        const { data: response, error } = await tryCatch(() => safeHttp.axios.request({
            url: data.webhookUrl,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            data: data.payload,
            timeout: timeoutInSeconds * 1000,
            validateStatus: () => true,
        }))

        // Delivery is fire-and-forget, so an error-level log is the only trace an operator gets when
        // the destination never receives the event — never downgrade these to warn (GIT-1539).
        if (error !== null) {
            ctx.log.error({
                webhookUrl: data.webhookUrl,
                webhook: { id: data.webhookId },
                error: error.message,
            }, 'Event destination delivery failed before reaching the destination')
        }
        else if (response.status >= MIN_FAILURE_HTTP_STATUS) {
            ctx.log.error({
                webhookUrl: data.webhookUrl,
                webhook: { id: data.webhookId },
                response: { status: response.status },
            }, 'Event destination responded with a failure status')
        }

        return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
    },
}

const MIN_FAILURE_HTTP_STATUS = 400
