import { httpClient, HttpMethod, Property, createTrigger, Trigger } from "@activepieces/framework"
import { TriggerStrategy } from "@activepieces/shared"

export const registerWebhook = ({
    name,
    description,
    displayName,
    event,
    sampleData
}: {
    name: string,
    description: string,
    displayName: string,
    event: string,
    sampleData: Record<string, unknown>
}): Trigger =>
    createTrigger({
        name,
        description,
        displayName,
        props: {
            api_secret: Property.SecretText({
                displayName: 'API Secret',
                description: 'Convert Kit API Secret',
                required: true
            })
        },
        sampleData: sampleData,
        type: TriggerStrategy.WEBHOOK,
        async onEnable(context) {
            const response = await httpClient.sendRequest({
                method: HttpMethod.POST,
                url: `https://api.convertkit.com/v3/automations/hooks`,
                body: {
                    target_url: context.webhookUrl,
                    event: {
                        name: event
                    },
                    api_secret: context.propsValue.api_secret
                }
            })
            await context.store.put("webhook_id", response.body['rule']['id'])
        },
        async onDisable(context) {
            const webhookId = await context.store.get<string>("webhook_id")
            await httpClient.sendRequest({
                method: HttpMethod.DELETE,
                url: `https://api.convertkit.com/v3/automations/hooks/${webhookId}`
            })
        },
        async run(context) {
            console.debug("trigger running", context)
            return [context.payload.body]
        }
    })