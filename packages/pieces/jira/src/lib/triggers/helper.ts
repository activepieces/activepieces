import { StoreScope, Trigger, TriggerStrategy, createTrigger } from "@activepieces/pieces-framework"
import { buildClient, jiraCommon } from "../common"

export function createJiraWebhookTrigger(event: string, name: string, displayName: string, description: string): Trigger {
    return createTrigger({
        name: name,
        displayName: displayName,
        description: description,
        type: TriggerStrategy.WEBHOOK,
        props: {
            authentication: jiraCommon.authentication,
            site_id: jiraCommon.site_id(),
            project_id: jiraCommon.project_id()
        },
        async onEnable(context) {
            const client = buildClient(context.propsValue)
            const res = await client.webhooks.registerDynamicWebhooks({
                webhooks: [
                    {
                        jqlFilter: 'project=' + context.propsValue.project_id,
                        events: [event]
                    }
                ],
                url: context.webhookUrl
            })
            if(!res.webhookRegistrationResult || res.webhookRegistrationResult.length == 0) {
                throw { error: 'Failed to create webhook' }
            }
            const webhookId = res.webhookRegistrationResult[0].createdWebhookId
            await context.store.put('jira_webhook_id', webhookId, StoreScope.FLOW)
        },
        async onDisable(context) {
            const webhookId: number|null = await context.store.get('jira_webhook_id', StoreScope.FLOW)
            if(!webhookId)
                return
            const client = buildClient(context.propsValue)
            await client.webhooks.deleteWebhookById({
                webhookIds: [ webhookId ]
            })
        },
        async run(context): Promise<unknown[]> {
            return [ context.payload.body ]
        },
        sampleData: {}
    })
}