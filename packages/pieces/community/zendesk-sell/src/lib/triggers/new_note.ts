import { Property, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { zendeskSellAuth } from '../common/auth';
import { MarkdownVariant } from '@activepieces/shared';


interface ZendeskSellWebhookPayload {
    data: {
        id: number;
        creator_id: number;
        resource_type: string;
        resource_id: number;
        content: string;
        created_at: string;
    };
    meta: {
        type: string; 
    };
}

export const newNote = createTrigger({
    auth: zendeskSellAuth,
    name: 'new_note',
    displayName: 'New Note',
    description: 'Fires when a new note is added to a record (lead, contact, deal).',
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
            5.  Under **Event subscriptions**, find and select **Note > Created**.
            6.  Save the webhook.
            `
        }),
    },
    sampleData: {
        "data": {
            "id": 1,
            "creator_id": 1,
            "resource_type": "lead",
            "resource_id": 1,
            "content": "Highly important.",
            "is_important": true,
            "tags": [
                "premium"
            ],
            "created_at": "2014-08-27T16:32:56Z",
            "updated_at": "2014-08-27T17:32:56Z",
            "type": "regular"
        },
        "meta": {
            "type": "note"
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


        if (body.meta && body.meta.type === 'note') {
            return [body];
        }
        

        if (Array.isArray(body)) {
            return body.filter((item: any) => item.meta && item.meta.type === 'note');
        }

        return [];
    },
});