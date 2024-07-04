import { WebhookResponse } from '@activepieces/pieces-framework'
import { logger, networkUtls, rejectedPromiseHandler } from '@activepieces/server-shared'
import { EventPayload, FlowId, FlowVersion, PopulatedFlow } from '@activepieces/shared'
import { workerApiService } from '../api/server-api.service'
import { triggerConsumer } from '../trigger/hooks/trigger-consumer'

export const webhookUtils = {
    async getWebhookPrefix(): Promise<string> {
        return `${await networkUtls.getApiUrl()}v1/webhooks`
    },
    async getAppWebhookUrl({
        appName,
    }: {
        appName: string
    }): Promise<string | undefined> {
        const frontendUrl = await networkUtls.getApiUrl()
        return `${frontendUrl}v1/app-events/${appName}`
    },
    async getWebhookUrl({
        flowId,
        simulate,
    }: GetWebhookUrlParams): Promise<string> {
        const suffix: WebhookUrlSuffix = simulate ? '/test' : ''
        const webhookPrefix = await this.getWebhookPrefix()
        return `${webhookPrefix}/${flowId}${suffix}`
    },
    async extractPayloadAndSave({ flowVersion, payload, projectId, engineToken, workerToken }: SaveSampleDataParams): Promise<unknown[]> {
        const payloads: unknown[] = await triggerConsumer.extractPayloads(engineToken, {
            projectId,
            flowVersion,
            payload,
            simulate: false,
        })

        rejectedPromiseHandler(workerApiService(workerToken).savePayloadsAsSampleData({
            flowId: flowVersion.flowId,
            projectId,
            payloads,
        }))
        return payloads
    },
    async handshake({
        populatedFlow,
        payload,
        engineToken,
    }: HandshakeParams): Promise<WebhookResponse | null> {
        logger.info(`[WebhookService#handshake] flowId=${populatedFlow.id}`)
        const { projectId } = populatedFlow
        const response = await triggerConsumer.tryHandshake(engineToken, {
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
}

type HandshakeParams = {
    populatedFlow: PopulatedFlow
    payload: EventPayload
    engineToken: string
}

type WebhookUrlSuffix = '' | '/test'

type GetWebhookUrlParams = {
    flowId: FlowId
    simulate?: boolean
}

type SaveSampleDataParams = {
    engineToken: string
    projectId: string
    workerToken: string
    flowVersion: FlowVersion
    payload: EventPayload
}

