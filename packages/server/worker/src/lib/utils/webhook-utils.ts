import {
    networkUtils,
    rejectedPromiseHandler,
} from '@activepieces/server-shared'
import {
    FlowId,
    FlowVersion,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { workerApiService } from '../api/server-api.service'

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


type SaveSampleDataParams = {
    flowVersion: FlowVersion
    projectId: string
    workerToken: string
    payloads: unknown[]
}
