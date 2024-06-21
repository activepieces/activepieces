import { flowRunService } from '../flows/flow-run/flow-run-service'
import { triggerHooks } from '../flows/trigger'
import { triggerEventService } from '../flows/trigger-events/trigger-event.service'
import { WebhookResponse } from '@activepieces/pieces-framework'
import { logger, rejectedPromiseHandler } from '@activepieces/server-shared'
import {
    EventPayload,
    ExecutionType,
    FlowRun,
    FlowVersion,
    PopulatedFlow,
    ProgressUpdateType,
    RunEnvironment,
} from '@activepieces/shared'
import { triggerConsumer } from 'server-worker'

export const webhookService = {
    async handshake({
        populatedFlow,
        payload,
        engineToken,
    }: HandshakeParams): Promise<WebhookResponse | null> {
        logger.info(`[WebhookService#handshake] flowId=${populatedFlow.id}`)
        const { projectId } = populatedFlow
        const response = await triggerHooks.tryHandshake({
            engineToken,
            projectId,
            flowVersion: populatedFlow.version,
            payload,
        })
        if (response !== null) {
            logger.info(`[WebhookService#handshake] condition met, handshake executed, response:
            ${JSON.stringify(response, null, 2)}`)
        }
        return response
    },
    async extractPayloadAndSave({ flowVersion, payload, projectId, engineToken }: SaveSampleDataParams): Promise<unknown[]> {
        const payloads: unknown[] = await triggerConsumer.extractPayloads(engineToken, {
            projectId,
            flowVersion,
            payload,
            simulate: false,
        })

        const savePayloads = payloads.map((payload) =>
            rejectedPromiseHandler(triggerEventService.saveEvent({
                flowId: flowVersion.flowId,
                payload,
                projectId,
            })),
        )

        rejectedPromiseHandler(Promise.all(savePayloads))
        return payloads
    },
    async startAndSaveRuns({
        projectId,
        flowVersion,
        filteredPayloads,
        synchronousHandlerId,
    }: SyncParams): Promise<FlowRun[]> {
        logger.info(`[WebhookService#callback] flowId=${flowVersion.id}`)
        const createFlowRuns = filteredPayloads.map((payload) =>
            flowRunService.start({
                environment: RunEnvironment.PRODUCTION,
                flowVersionId: flowVersion.id,
                payload,
                synchronousHandlerId,
                progressUpdateType: ProgressUpdateType.WEBHOOK_RESPONSE,
                projectId,
                executionType: ExecutionType.BEGIN,
            }),
        )
        return Promise.all(createFlowRuns)
    }
}


type SaveSampleDataParams = {
    engineToken: string
    projectId: string
    flowVersion: FlowVersion
    payload: EventPayload
}


type HandshakeParams = {
    populatedFlow: PopulatedFlow
    payload: EventPayload
    engineToken: string
}

type SyncParams = {
    projectId: string
    flowVersion: FlowVersion
    filteredPayloads: unknown[]
    synchronousHandlerId?: string
}
