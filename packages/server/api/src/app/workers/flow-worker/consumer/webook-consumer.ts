import { StatusCodes } from 'http-status-codes'
import { flowService } from '../../../flows/flow/flow.service'
import { webhookService } from '../../../webhooks/webhook-service'
import { EngineHttpResponse, engineResponseWatcher } from '../engine-response-watcher'
import { FlowStatus, isNil } from '@activepieces/shared'
import { WebhookJobData } from 'server-worker'

export const webhookConsumer = {
    async consumeWebhook(data: WebhookJobData): Promise<void> {
        const { flowId, payload, simulate } = data
        const flow = await flowService.getOneById(flowId)
        if (isNil(flow)) {
            await stopAndReply(data, {
                status: StatusCodes.GONE,
                body: {},
                headers: {},
            })
            return
        }
        if (flow.status !== FlowStatus.ENABLED && !simulate) {
            await stopAndReply(data, {
                status: StatusCodes.NOT_FOUND,
                body: {},
                headers: {},
            })
            return
        }
        const handshakeResponse = await webhookService.handshake({
            flow,
            payload,
            simulate,
        })
        if (!isNil(handshakeResponse)) {
            await stopAndReply(data, {
                status: handshakeResponse.status,
                headers: handshakeResponse.headers ?? {},
                body: handshakeResponse.body,
            })
            return
        }
        if (simulate) {
            await webhookService.simulationCallback({
                flow,
                payload,
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
        if (!isNil(data.synchronousHandlerId)) {
            const firstRun = runs[0]
            const response = await engineResponseWatcher.oneTimeListener(firstRun.id, true)
            await stopAndReply(data, response)
        }
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

