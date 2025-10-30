import {
    AppSystemProp,
    environmentVariables,
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
        externalId,
        environmentName,
        simulate,
        publicApiUrl,
        workerToken,
    }: GetWebhookUrlParams): Promise<string> {
        const suffix: WebhookUrlSuffix = simulate ? '/test' : ''

        let identifier = externalId
        if (!identifier) {
            try {
                if (workerToken) {
                    const flow = await workerApiService(workerToken).getFlow(flowId)
                    identifier = flow.externalId || flowId
                } else {
                    identifier = flowId
                }
            } catch (error) {
                log.warn({ flowId, error }, 'Failed to fetch flow for externalId, using flowId')
                identifier = flowId
            }
        }

        const environment = environmentName || environmentVariables.getEnvironment(AppSystemProp.ENVIRONMENT_NAME) || 'default'

        return networkUtils.combineUrl(publicApiUrl, `v1/webhooks/${environment}/${identifier}${suffix}`)
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
    externalId?: string | null
    environmentName?: string
    simulate?: boolean
    publicApiUrl: string
    workerToken?: string
}


type SaveSampleDataParams = {
    flowVersion: FlowVersion
    projectId: string
    workerToken: string
    payloads: unknown[]
}
