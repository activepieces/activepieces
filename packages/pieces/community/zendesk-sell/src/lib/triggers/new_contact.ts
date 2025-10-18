import { Property, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { zendeskSellAuth } from '../common/auth';
import { MarkdownVariant } from '@activepieces/shared';


interface ZendeskSellWebhookPayload {
    data: {
        id: number;
        name: string;
        email?: string;

    };
    meta: {
        type: string;
    };
}

export const newContact = createTrigger({
    auth: zendeskSellAuth,
    name: 'new_contact',
    displayName: 'New Contact',
    description: 'Fires when a new contact is created in Zendesk Sell.',
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
            5.  Under **Event subscriptions**, find and select **Contact > Created**.
            6.  Save the webhook.
            `
        }),
    },
    sampleData: {
        "data": {
            "id": 2,
            "creator_id": 1,
            "owner_id": 1,
            "is_organization": false,
            "contact_id": 1,
            "parent_organization_id": null,
            "name": "Mark Johnson",
            "first_name": "Mark",
            "last_name": "Johnson",
            "customer_status": "none",
            "prospect_status": "none",
            "title": "CEO",
            "description": "I know him via Tom",
            "industry": "Design Services",
            "website": "http://www.designservice.com",
            "email": "mark@designservice.com",
            "phone": "508-778-6516",
            "mobile": "508-778-6516",
            "address": {
                "line1": "2726 Smith Street",
                "city": "Hyannis",
                "postal_code": "02601",
                "state": "MA",
                "country": "US"
            },
            "created_at": "2014-08-27T16:32:56Z",
            "updated_at": "2014-08-27T16:32:56Z"
        },
        "meta": {
            "type": "contact"
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


        if (body.meta && body.meta.type === 'contact') {
            return [body];
        }
        

        if (Array.isArray(body)) {
            return body.filter((item: any) => item.meta && item.meta.type === 'contact');
        }

        return [];
    },
});