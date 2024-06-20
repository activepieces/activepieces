import { StatusCodes } from 'http-status-codes'
import { flowService } from '../../flows/flow/flow.service'
import { webhookService } from '../../webhooks/webhook-service'
import { webhookSimulationService } from '../../webhooks/webhook-simulation/webhook-simulation-service'
import { EngineHttpResponse, webhookResponseWatcher } from '../helper/webhook-response-watcher'
import { FlowStatus, isNil, PopulatedFlow } from '@activepieces/shared'
import { WebhookJobData } from 'server-worker'

export const webhookExecutor = {
    async consumeWebhook(data: WebhookJobData): Promise<void> {
        const { flowId, payload, simulate } = data
        const populatedFlow = await getPopulatedFlow(flowId, simulate)
        if (isNil(populatedFlow)) {
            await stopAndReply(data, {
                status: StatusCodes.GONE,
                body: {},
                headers: {},
            })
            return
        }
        const handshakeResponse = await webhookService.handshake({
            populatedFlow,
            payload,
        })
        if (!isNil(handshakeResponse)) {
            await stopAndReply(data, {
                status: handshakeResponse.status,
                headers: handshakeResponse.headers ?? {},
                body: handshakeResponse.body,
            })
            return
        }

        if (populatedFlow.status !== FlowStatus.ENABLED && !simulate) {
            await stopAndReply(data, {
                status: StatusCodes.NOT_FOUND,
                body: {},
                headers: {},
            })
            return
        }
        const filteredPayloads = await webhookService.extractPayloadAndSave({
            flowVersion: populatedFlow.version,
            payload: data.payload,
            projectId: populatedFlow.projectId,
        })

        if (simulate) {
            await webhookSimulationService.delete({ flowId: populatedFlow.id, projectId: populatedFlow.projectId })
            return
        }
        const runs = await webhookService.startAndSaveRuns({
            flowVersion: populatedFlow.version,
            projectId: populatedFlow.projectId,
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

async function getPopulatedFlow(flowId: string, simulate: boolean): Promise<PopulatedFlow | null> {
    const flow = await flowService.getOneById(flowId)
    if (isNil(flow)) {
        return null
    }
    return flowService.getOnePopulated({
        id: flow.id,
        projectId: flow.projectId,
        versionId: simulate ? undefined : flow.publishedVersionId!,
    })
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

