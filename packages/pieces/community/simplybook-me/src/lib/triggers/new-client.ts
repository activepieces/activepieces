
import { createTrigger, Property, TriggerStrategy } from "@activepieces/pieces-framework";
import { simplybookMeAuth } from "../common/auth";
import * as crypto from "crypto";

interface NewClientPayload {
    event: string;
    data: {
        client_id: string;
        [key: string]: unknown;
    }
}

export const newClient = createTrigger({
    auth: simplybookMeAuth,
    name: 'new_client',
    displayName: 'New Client',
    description: 'Fires when a new client is added (via booking or manually).',
    props: {
        info: Property.MarkDown({
            value: `
            **Webhook URL:**
            \`\`\`text
            {{webhookUrl}}
            \`\`\`
            Please copy the URL above and follow the setup instructions below.
            `
        }),
        instructions: Property.MarkDown({
            value: `
            **Setup Instructions:**
            1.  Go to your SimplyBook.me dashboard and navigate to **Plugins > API > Webhooks**.
            2.  Click **"Add"** to create a new webhook.
            3.  Paste the webhook URL from above into the **URL** field.
            4.  Select the event **client.created**.
            5.  Save the webhook and ensure you have saved the "Webhook Secret" in your Authentication settings for this piece.
            `
        }),
    },
    type: TriggerStrategy.WEBHOOK,
    
    async onEnable(): Promise<void> {
        return;
    },

    async onDisable(): Promise<void> {
        return;
    },

    async run(context) {
        const signature = context.payload.headers['x-simplybook-signature'] as string;
        const secret = context.auth.webhookSecret;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(context.payload.body))
            .digest('hex');

        if (signature !== expectedSignature) {
            console.warn("SimplyBook.me Webhook: Invalid signature.");
            return [];
        }
        
        const body = context.payload.body as NewClientPayload;

        if (body && body.event === 'client.created') {
            return [body.data];
        }

        return [];
    },

    sampleData: {
        "client_id": 12345,
        "name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "+15551234567",
        "address1": "123 Main St",
        "city": "Anytown"
    }
});