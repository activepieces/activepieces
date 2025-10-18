import { Property, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { zendeskSellAuth } from '../common/auth';
import { MarkdownVariant } from '@activepieces/shared';
import { zendeskSellCommon } from '../common/props'; 


interface ZendeskSellWebhookPayload {
    data: {
        id: number;
        stage_id: number;

    };
    meta: {
        type: string; 
        event: {
            type: string; 

        }
    };
}

export const dealEntersStage = createTrigger({
    auth: zendeskSellAuth,
    name: 'deal_enters_stage',
    displayName: 'Deal Enters New Stage',
    description: 'Fires when a deal transitions into a specified pipeline stage.',
    props: {
        liveMarkdown: Property.MarkDown({
            value: `
            **Live URL:**
            \`\`\`text
            {{webhookUrl}}
            \`\`\``,
            variant: MarkdownVariant.BORDERLESS,
        }),
        instructions: Property.MarkDown({
            value: `
            **Manual Setup Required**
            1.  Go to your Zendesk Sell account.
            2.  Navigate to **Settings > Integrations > Webhooks**.
            3.  Click **Add webhook**.
            4.  Paste the **Live URL** (from above) into the **URL** field.
            5.  Under **Event subscriptions**, find and select **Deal > Updated**.
            6.  Save the webhook.
            *This trigger will automatically filter events to fire only for the stage you select below.*
            `
        }),
        pipeline_id: zendeskSellCommon.pipeline(true), 
        stage_id: zendeskSellCommon.stage(true), 
    },
    sampleData: {
        "meta": {
            "type": "event",
            "event": {
                "type": "deal_updated",
                "actor_id": 12345,
                "resource_id": 67890,
                "occurred_at": "2025-10-18T10:30:00Z"
            }
        },
        "data": {
            "id": 67890,
            "name": "New Big Deal",
            "value": 50000,
            "stage_id": 2, 
            "contact_id": 54321,
            "owner_id": 12345,
            "updated_at": "2025-10-18T10:30:00Z"
        }
    },
    type: TriggerStrategy.WEBHOOK,
   
    async onEnable() {
        return;
    },
    

    async onDisable() {
        return;
    },


    async run(context) {
        const body = context.payload.body as ZendeskSellWebhookPayload;
        const targetStageId = context.propsValue.stage_id;

        const results: ZendeskSellWebhookPayload[] = [];

        const processEvent = (event: ZendeskSellWebhookPayload) => {
            if (
                event.meta?.type === 'event' &&
                event.meta?.event?.type === 'deal_updated' &&
                event.data?.stage_id === targetStageId
            ) {
                results.push(event);
            }
        };

        if (Array.isArray(body)) {
            body.forEach(processEvent);
        } else {
            processEvent(body);
        }

        return results;
    },
});