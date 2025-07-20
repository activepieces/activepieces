import {
    networkUtils,
    rejectedPromiseHandler,
} from '@activepieces/server-shared'
import {
    EventPayload,
    FlowId,
    FlowVersion,
    TriggerType,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { workerApiService } from '../api/server-api.service'
import { triggerConsumer } from '../trigger/hooks/trigger-consumer'
export const webhookUtils = (log: FastifyBaseLogger) => ({

    async getAppWebhookUrl({
        appName,
        publicApiUrl,
    }: {
        appName: string
        publicApiUrl: string
    }): Promise<string | undefined> {
        return networkUtils.combineUrl(publicApiUrl, `v1/app-events/${appName}`)
    },
    async getWebhookUrl({
        flowId,
        simulate,
        publicApiUrl,
    }: GetWebhookUrlParams): Promise<string> {
        const suffix: WebhookUrlSuffix = simulate ? '/test' : ''
        return networkUtils.combineUrl(publicApiUrl, `v1/webhooks/${flowId}${suffix}`)
    },
    async extractPayload({
        flowVersion,
        payload,
        projectId,
        engineToken,
        simulate,
    }: ExtractPayloadParams): Promise<unknown[]> {
        if (flowVersion.trigger.type === TriggerType.EMPTY) {
            log.warn({
                flowVersionId: flowVersion.id,
            }, '[WebhookUtils#extractPayload] empty trigger, skipping')
            return []
        }
        log.info({
            flowVersionId: flowVersion.id,
            simulate,
        }, '[WebhookUtils#extractPayload] extracting payloads')
        return triggerConsumer.extractPayloads(
            engineToken,
            log,
            {
                projectId,
                flowVersion,
                payload,
                simulate,
            },
        )
    },
    savePayloadsAsSampleData({
        flowVersion,
        projectId,
        workerToken,
        payloads,
    }: SaveSampleDataParams): void {
        rejectedPromiseHandler(
            workerApiService(workerToken).savePayloadsAsSampleData({
                flowId: flowVersion.flowId,
                projectId,
                payloads,
            }),
            log,
        )
    },

})


type WebhookUrlSuffix = '' | '/test'

type GetWebhookUrlParams = {
    flowId: FlowId
    simulate?: boolean
    publicApiUrl: string
}

type ExtractPayloadParams = {
    engineToken: string
    projectId: string
    flowVersion: FlowVersion
    payload: EventPayload
    simulate: boolean
}

type SaveSampleDataParams = {
    flowVersion: FlowVersion
    projectId: string
    workerToken: string
    payloads: unknown[]
}
