import { isNil, isObject, tryCatch } from '@activepieces/core-utils'
import { otlpLogs, safeHttp } from '@activepieces/server-utils'
import { EngineResponseStatus, EventDestinationJobData, WorkerJobType } from '@activepieces/shared'
import { workerSettings } from '../../config/worker-settings'
import { FireAndForgetJobResult, JobContext, JobHandler, JobResultKind } from '../types'

export const eventDestinationJob: JobHandler<EventDestinationJobData, FireAndForgetJobResult> = {
    jobType: WorkerJobType.EVENT_DESTINATION,
    async execute(ctx: JobContext, data: EventDestinationJobData): Promise<FireAndForgetJobResult> {
        const timeoutInSeconds = workerSettings.getSettings().EVENT_DESTINATION_TIMEOUT_SECONDS

        const headers = data.hasHeaders === true ? await resolveHeaders({ ctx, data }) : {}
        if (isNil(headers)) {
            ctx.log.warn({
                webhook: { id: data.webhookId },
            }, 'Event destination disappeared before delivery, dropping the event')
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }

        const { data: response, error } = await tryCatch(() => safeHttp.axios.request({
            url: data.webhookUrl,
            method: 'POST',
            headers: { 'Content-Type': data.contentType ?? 'application/json', ...headers },
            data: toRequestBody(data),
            timeout: timeoutInSeconds * 1000,
            validateStatus: () => true,
        }))

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

async function resolveHeaders({ ctx, data }: ResolveHeadersParams): Promise<Record<string, string> | null> {
    const resolved = await ctx.apiClient.resolveEventDestinationHeaders({
        platformId: data.platformId,
        destinationId: data.webhookId,
    })
    return isNil(resolved) ? null : resolved.headers
}

function toRequestBody(data: EventDestinationJobData): unknown {
    if (data.contentType !== 'application/x-protobuf' || !isObject(data.payload)) {
        return data.payload
    }
    return Buffer.from(otlpLogs.encodeExportRequest(data.payload))
}

const MIN_FAILURE_HTTP_STATUS = 400

type ResolveHeadersParams = {
    ctx: JobContext
    data: EventDestinationJobData
}
