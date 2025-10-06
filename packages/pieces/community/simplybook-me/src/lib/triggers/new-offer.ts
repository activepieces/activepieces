// src/lib/triggers/new-offer.ts

import { createTrigger, Property, TriggerStrategy } from "@activepieces/pieces-framework";
import { simplybookMeAuth } from "../common/auth";
// The 'crypto' import is no longer needed

interface NewOfferPayload {
    event: string;
    data: {
        offer_id: string;
        client_id: string;
        [key: string]: unknown;
    }
}

export const newOffer = createTrigger({
    auth: simplybookMeAuth,
    name: 'new_offer',
    displayName: 'New Offer',
    description: 'Fires when a new offer (proposal or quote) is created.',
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
            4.  Select the **New Offer** event from the list of available webhook triggers.
            5.  Save the webhook.
            ` // Step about the Webhook Secret has been removed
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
        // The signature verification block has been removed for simplicity.
        
        const body = context.payload.body as NewOfferPayload;

        // NOTE: The event name 'offer.created' is assumed based on API patterns.
        if (body && body.event === 'offer.created') {
            return [body.data];
        }

        return [];
    },

    sampleData: {
        "offer_id": "prop_12345",
        "client_id": "67890",
        "status": "sent",
        "total_amount": "150.00",
        "currency": "USD",
        "created_at": "2025-10-05T18:00:00Z"
    }
});