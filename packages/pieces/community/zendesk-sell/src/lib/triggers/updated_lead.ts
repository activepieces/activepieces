import { Property, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { zendeskSellAuth } from '../common/auth';
import { MarkdownVariant } from '@activepieces/shared';


interface ZendeskSellWebhookPayload {
    data: {
        id: number;
        first_name?: string;
        last_name?: string;
        organization_name?: string;
        email?: string;
        status?: string;
        updated_at: string;
    };
    meta: {
        type: string;
        event_type: string;
    };
}

export const updatedLead = createTrigger({
    auth: zendeskSellAuth,
    name: 'updated_lead',
    displayName: 'Updated Lead',
    description: 'Fires when an existing lead record is updated.',
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
            5.  Under **Event subscriptions**, find and select **Lead > Updated**.
            6.  Save the webhook.
            `
        }),
    },
    sampleData: {
        "meta": {
            "type": "lead",
            "event_type": "updated",
            "event_time": "2025-10-18T10:25:00Z"
        },
        "data": {
            "id": 1,
            "creator_id": 1,
            "owner_id": 1,
            "first_name": "Mark",
            "last_name": "Johnson",
            "organization_name": "Design Services Inc.",
            "status": "Contacted",
            "source_id": 10,
            "title": "Senior Designer",
            "description": "Updated description.",
            "email": "mark.johnson@example.com",
            "phone": "508-778-6516",
            "mobile": "508-778-6517",
            "address": {
                "line1": "2726 Smith Street",
                "city": "Hyannis",
                "postal_code": "02601",
                "state": "MA",
                "country": "US"
            },
            "tags": [
                "important",
                "follow-up"
            ],
            "created_at": "2024-08-27T16:32:56Z",
            "updated_at": "2025-10-18T10:25:00Z"
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

        if (body.meta && body.meta.type === 'lead' && body.meta.event_type === 'updated') {
            return [body];
        }
        
        if (Array.isArray(body)) {
            return body.filter((item: any) => 
                item.meta && item.meta.type === 'lead' && item.meta.event_type === 'updated'
            );
        }

        return [];
    },
});