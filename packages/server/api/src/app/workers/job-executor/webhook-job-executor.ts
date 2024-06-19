import { StatusCodes } from 'http-status-codes'
import { flowService } from '../../flows/flow/flow.service'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { webhookService } from '../../webhooks/webhook-service'
import { webhookSimulationService } from '../../webhooks/webhook-simulation/webhook-simulation-service'
import { EngineHttpResponse, webhookResponseWatcher } from '../helper/webhook-response-watcher'
import { FlowStatus, isNil } from '@activepieces/shared'
import { WebhookJobData } from 'server-worker'

export const webhookExecutor = {
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

        if (flow.status !== FlowStatus.ENABLED && !simulate) {
            await stopAndReply(data, {
                status: StatusCodes.NOT_FOUND,
                body: {},
                headers: {},
            })
            return
        }
        const flowVersion = await flowVersionService.getFlowVersionOrThrow({
            flowId: flow.id,
            versionId: simulate ? undefined : flow.publishedVersionId!,
        })

        const filteredPayloads = await webhookService.extractPayloadAndSave({
            flowVersion,
            payload: data.payload,
            projectId: flow.projectId,
        })

        if (simulate) {
            await webhookSimulationService.delete({ flowId: flow.id, projectId: flow.projectId })
            return
        }
        const runs = await webhookService.startAndSaveRuns({
            flowVersion,
            projectId: flow.projectId,
            synchronousHandlerId: webhookResponseWatcher.getHandlerId(),
            filteredPayloads,
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
            const response = await webhookResponseWatcher.oneTimeListener(firstRun.id, true)
            await stopAndReply(data, response)
        }
    },

}

async function stopAndReply(data: WebhookJobData, response: EngineHttpResponse): Promise<void> {
    const { requestId, synchronousHandlerId } = data
    if (!isNil(synchronousHandlerId)) {
        await webhookResponseWatcher.publish(
            requestId,
            synchronousHandlerId,
            response,
        )
    }
}

