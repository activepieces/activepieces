import { safeHttp } from '@activepieces/server-utils'
import {
    EngineResponseStatus,
    EventDestinationJobData,
    tryCatch,
    tryCatchSync,
    WorkerJobType,
} from '@activepieces/shared'
import { workerSettings } from '../../config/worker-settings'
import { FireAndForgetJobResult, JobContext, JobHandler, JobResultKind } from '../types'

export const eventDestinationJob: JobHandler<EventDestinationJobData, FireAndForgetJobResult> = {
    jobType: WorkerJobType.EVENT_DESTINATION,
    async execute(ctx: JobContext, data: EventDestinationJobData): Promise<FireAndForgetJobResult> {
        const timeoutInSeconds = workerSettings.getSettings().EVENT_DESTINATION_TIMEOUT_SECONDS

        ctx.log.info({ webhookUrl: data.webhookUrl, webhookId: data.webhookId }, 'Sending event destination')

        const startedAt = Date.now()
        const { data: response, error } = await tryCatch(() => safeHttp.axios.request({
            url: data.webhookUrl,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            data: data.payload,
            timeout: timeoutInSeconds * 1000,
            validateStatus: () => true,
        }))
        const durationMs = Date.now() - startedAt

        if (error) {
            ctx.log.warn({
                webhookUrl: data.webhookUrl,
                webhookId: data.webhookId,
                durationMs,
                error: error.message,
            }, 'Event destination request failed before reaching the server')
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }

        const isSuccess = response.status >= 200 && response.status < 300
        ctx.log.info({
            webhookUrl: data.webhookUrl,
            webhookId: data.webhookId,
            status: response.status,
            statusText: response.statusText,
            durationMs,
            success: isSuccess,
            responseBody: truncateResponseBody(response.data),
        }, isSuccess
            ? 'Event destination delivered'
            : 'Event destination returned non-success status')

        return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
    },
}

function truncateResponseBody(body: unknown): string {
    if (body === null || body === undefined) {
        return ''
    }
    let asString: string
    if (typeof body === 'string') {
        asString = body
    }
    else {
        const { data: serialized, error } = tryCatchSync(() => JSON.stringify(body))
        asString = error || serialized === null ? String(body) : serialized
    }
    if (asString.length > MAX_LOGGED_BODY_LENGTH) {
        return `${asString.slice(0, MAX_LOGGED_BODY_LENGTH)}…`
    }
    return asString
}

const MAX_LOGGED_BODY_LENGTH = 500
