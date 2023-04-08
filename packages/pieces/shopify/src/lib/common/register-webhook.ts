import { httpClient, HttpMethod  } from "@activepieces/pieces-common";
import { createTrigger, Trigger, TriggerStrategy} from '@activepieces/framework';
import { shopifyCommon } from "./props";

export const createShopifyWebhookTrigger = ({
    name,
    description,
    displayName,
    sampleData,
    topic
}: {
    name: string,
    description: string,
    displayName: string,
    topic: string,
    sampleData: Record<string, unknown>
}): Trigger =>
    createTrigger({
        name,
        description,
        displayName,
        props: {
            authentication: shopifyCommon.authentication
        },
        sampleData: sampleData,
        type: TriggerStrategy.WEBHOOK,
        async onEnable(context) {
            const shopName = context.propsValue.authentication.props!['shop'];
            const response = await httpClient.sendRequest<{
                webhook: {
                    id: string
                }
            }>({
                method: HttpMethod.POST,
                url: `https://${shopName}.myshopify.com/admin/api/2023-01/webhooks.json`,
                headers: {
                    "X-Shopify-Access-Token": context.propsValue.authentication.access_token
                },
                body: {
                    webhook: {
                        topic: topic,
                        address: context.webhookUrl,
                        format: "json"
                    }
                }
            })
            await context.store?.put(`shopify_webhook_id`, response.body.webhook.id)
            console.log("webhook created", response.body.webhook.id);
        },
        async onDisable(context) {
            const webhookId = await context.store.get<string>(`shopify_webhook_id`);
            const shopName = context.propsValue.authentication.props!['shop'];
            await httpClient.sendRequest<{
                webhook: {
                    id: string
                }
            }>({
                method: HttpMethod.DELETE,
                url: `https://${shopName}.myshopify.com/admin/api/2023-01/webhooks/${webhookId}.json`,
                headers: {
                    "X-Shopify-Access-Token": context.propsValue.authentication.access_token
                }
            })
            await context.store?.put(`shopify_webhook_id`, null)
        },
        async run(context) {
            console.debug("trigger running", context)
            return [context.payload.body]
        }
    })

