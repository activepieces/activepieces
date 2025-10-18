import { Property, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { zendeskSellAuth } from '../common/auth';
import { MarkdownVariant } from '@activepieces/shared';


interface ZendeskSellWebhookPayload {
    data: {
        id: number;
        name: string;
        email?: string;
        updated_at: string;
    };
    meta: {
        type: string;
        event_type: string;
    };
}

export const updatedContact = createTrigger({
    auth: zendeskSellAuth,
    name: 'updated_contact',
    displayName: 'Updated Contact',
    description: 'Fires when an existing contact is updated.',
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
            5.  Under **Event subscriptions**, find and select **Contact > Updated**.
            6.  Save the webhook.
            `
        }),
    },
    sampleData: {
        "meta": {
            "type": "contact",
            "event_type": "updated",
            "event_time": "2025-10-18T10:30:00Z"
        },
        "data": {
            "id": 2,
            "creator_id": 1,
            "owner_id": 1,
            "is_organization": false,
            "contact_id": 1,
            "name": "Mark Johnson",
            "first_name": "Mark",
            "last_name": "Johnson",
            "customer_status": "current", 
            "prospect_status": "none",
            "title": "CEO",
            "email": "mark@designservice.com",
            "phone": "508-778-6516",
            "address": {
                "line1": "2726 Smith Street",
                "city": "Hyannis",
            },
            "created_at": "2014-08-27T16:32:56Z",
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


        if (body.meta && body.meta.type === 'contact' && body.meta.event_type === 'updated') {
            return [body];
        }
        

        if (Array.isArray(body)) {
            return body.filter((item: any) => 
                item.meta && item.meta.type === 'contact' && item.meta.event_type === 'updated'
            );
        }

        return [];
    },
});