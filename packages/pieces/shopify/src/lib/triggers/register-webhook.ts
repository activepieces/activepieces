import { httpClient, HttpMethod, Property, createTrigger, Trigger } from "@activepieces/framework"
import { TriggerStrategy } from "@activepieces/shared"

export const registerWebhooks = ({
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
            authentication: Property.OAuth2({
                props: {
                    shop: Property.ShortText({
                        displayName: 'Shop Name',
                        description: 'Shop Name',
                        required: true
                    })
                },
                displayName: 'Authentication',
                description: 'Authentication for the webhook',
                required: true,
                authUrl: "https://{shop}.myshopify.com/admin/oauth/authorize",
                tokenUrl: "https://{shop}.myshopify.com/admin/oauth/access_token",
                scope: ['read_orders', 'read_customers']
            })
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
            console.log(response);
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
            await context.store?.put(`shopify_webhook_id`, undefined)
        },
        async run(context) {
            console.debug("trigger running", context)
            return [context.payload.body]
        }
    })

