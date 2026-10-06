import { isNil, isObject } from '@activepieces/core-utils'
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
                platform: { id: data.platformId },
            }, 'Event destination was deleted or moved to another URL before delivery, dropping the event')
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }

        const result = await safeHttp.postForStatus({
            url: data.webhookUrl,
            headers: { ...headers, 'Content-Type': data.contentType ?? 'application/json' },
            body: toRequestBody(data),
            timeoutMs: timeoutInSeconds * 1000,
        })

        if (!result.responded) {
            ctx.log.error({
                webhookUrl: data.webhookUrl,
                webhook: { id: data.webhookId, deliveryFailure: result.failure },
                error: result.error.message,
            }, 'Event destination delivery failed before reaching the destination')
        }
        else if (result.status >= MIN_FAILURE_HTTP_STATUS) {
            ctx.log.error({
                webhookUrl: data.webhookUrl,
                webhook: { id: data.webhookId },
                response: { status: result.status },
            }, 'Event destination responded with a failure status')
        }

        return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
    },
}

async function resolveHeaders({ ctx, data }: ResolveHeadersParams): Promise<Record<string, string> | null> {
    const resolved = await ctx.apiClient.resolveEventDestinationHeaders({
        platformId: data.platformId,
        destinationId: data.webhookId,
        destinationUrl: data.webhookUrl,
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
