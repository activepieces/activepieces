import { Property, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { zendeskSellAuth } from '../common/auth';
import { MarkdownVariant } from '@activepieces/shared';

interface ZendeskSellWebhookPayload {
    data: {
        id: number;
        name: string;
        contact_id: number;
        value: string;
        stage_id: number;

    };
    meta: {
        type: string;
    };
}

export const newDeal = createTrigger({
    auth: zendeskSellAuth,
    name: 'new_deal',
    displayName: 'New Deal',
    description: 'Fires when a new deal is created.',
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
            5.  Under **Event subscriptions**, find and select **Deal > Created**.
            6.  Save the webhook.
            `
        }),
    },
    sampleData: {
        "data": {
            "id": 123,
            "creator_id": 456,
            "name": "New Website Project",
            "contact_id": 42,
            "value": "15000",
            "currency": "USD",
            "hot": false,
            "stage_id": 1,
            "created_at": "2025-10-18T10:00:00Z",
            "updated_at": "2025-10-18T10:00:00Z"
        },
        "meta": {
            "type": "deal"
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


        if (body.meta && body.meta.type === 'deal') {
            return [body];
        }

        if (Array.isArray(body)) {
            return body.filter((item: any) => item.meta && item.meta.type === 'deal');
        }

        return [];
    },
});