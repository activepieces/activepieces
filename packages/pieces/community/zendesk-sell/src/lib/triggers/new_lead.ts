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
    };
    meta: {
        type: string;
    };
}

export const newLead = createTrigger({
    auth: zendeskSellAuth,
    name: 'new_lead',
    displayName: 'New Lead',
    description: 'Fires when a new lead is created.',
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
            5.  Under **Event subscriptions**, find and select **Lead > Created**.
            6.  Save the webhook.
            `
        }),
    },
    sampleData: {
        "data": {
            "id": 1,
            "creator_id": 1,
            "owner_id": 1,
            "first_name": "Mark",
            "last_name": "Johnson",
            "organization_name": "Design Services Company",
            "status": "New",
            "source_id": 10,
            "title": "CEO",
            "description": "I know him via Tom",
            "email": "mark@example.com",
            "phone": "508-778-6516",
            "address": {
                "line1": "2726 Smith Street",
                "city": "Hyannis"
            },
            "tags": [
                "important"
            ],
            "created_at": "2014-08-27T16:32:56Z",
            "updated_at": "2014-08-27T16:32:56Z"
        },
        "meta": {
            "type": "lead"
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


        if (body.meta && body.meta.type === 'lead') {
            return [body];
        }
        

        if (Array.isArray(body)) {
            return body.filter((item: any) => item.meta && item.meta.type === 'lead');
        }

        return [];
    },
});