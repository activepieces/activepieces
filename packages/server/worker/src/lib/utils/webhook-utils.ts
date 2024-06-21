import { networkUtls } from '@activepieces/server-shared'
import { FlowId } from '@activepieces/shared'

export const webhookUtils = {
    async getWebhookPrefix(): Promise<string> {
        return `${await networkUtls.getApiUrl()}v1/webhooks`
    },
    async getWebhookUrl({
        flowId,
        simulate,
    }: GetWebhookUrlParams): Promise<string> {
        const suffix: WebhookUrlSuffix = simulate ? '/test' : ''
        const webhookPrefix = await this.getWebhookPrefix()
        return `${webhookPrefix}/${flowId}${suffix}`
    },
}
type WebhookUrlSuffix = '' | '/test'

type GetWebhookUrlParams = {
    flowId: FlowId
    simulate?: boolean
}

