import { Property, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { zendeskSellAuth } from '../common/auth';
import { MarkdownVariant } from '@activepieces/shared';

interface ZendeskSellWebhookPayload {
    data: {
        id: number;
        name: string;
        value: number;
        stage_id: number;
        contact_id: number;
        owner_id: number;
        updated_at: string;
    };
    meta: {
        type: string; 
        event: {
            type: string; 
            resource_id: number;
        }
    };
}

export const updatedDeal = createTrigger({
    auth: zendeskSellAuth,
    name: 'updated_deal',
    displayName: 'Updated Deal',
    description: 'Fires when a deal is modified.',
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
            `
        }),
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


        if (body.meta && body.meta.type === 'event' && body.meta.event && body.meta.event.type === 'deal_updated') {
            return [body];
        }
        
        if (Array.isArray(body)) {
            return body.filter((item: any) => 
                item.meta && item.meta.type === 'event' && 
                item.meta.event && item.meta.event.type === 'deal_updated'
            );
        }

        return [];
    },
});