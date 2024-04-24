import { StatusCodes } from 'http-status-codes'
import { flowService } from '../../flows/flow/flow.service'
import { webhookService } from '../../webhooks/webhook-service'
import { EngineHttpResponse, engineResponseWatcher } from './engine-response-watcher'
import { WebhookJobData } from './job-data'
import { isNil } from '@activepieces/shared'

export const webhookConsumer = {
    async consumeWebhook(data: WebhookJobData): Promise<void> {
        const { flowId, payload } = data
        const flow = await flowService.getOneById(flowId)
        if (isNil(flow)) {
            await stopAndReply(data, {
                status: StatusCodes.GONE,
                body: {},
                headers: {},
            })
            return
        }
        const runs = await webhookService.callback({
            flow,
            synchronousHandlerId: engineResponseWatcher.getHandlerId(),
            payload,
        })
        if (isNil(runs) || runs.length === 0 || isNil(runs[0])) {
            await stopAndReply(data, {
                status: StatusCodes.NOT_FOUND,
                body: {},
                headers: {},
            })
            return
        }
        const firstRun = runs[0]
        const response = await engineResponseWatcher.listen(firstRun.id, true)
        await stopAndReply(data, response)
    },

}

async function stopAndReply(data: WebhookJobData, response: EngineHttpResponse): Promise<void> {
    const { requestId, synchronousHandlerId } = data
    if (!isNil(synchronousHandlerId)) {
        await engineResponseWatcher.publish(
            requestId,
            synchronousHandlerId,
            response,
        )
    }
}

