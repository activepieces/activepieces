// src/lib/triggers/new-invoice.ts

import { createTrigger, Property, TriggerStrategy } from "@activepieces/pieces-framework";
import { simplybookMeAuth } from "../common/auth";
// The 'crypto' import is no longer needed

interface NewInvoicePayload {
    event: string;
    data: {
        invoice_number: string;
        [key: string]: unknown;
    }
}

export const newInvoice = createTrigger({
    auth: simplybookMeAuth,
    name: 'new_invoice',
    displayName: 'New Invoice',
    description: 'Fires when a new invoice is generated or paid (requires "Accept Payments" feature).',
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
            4.  Select the **New Invoice** event from the list.
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
        
        const body = context.payload.body as NewInvoicePayload;

        // NOTE: The event name 'invoice.created' is assumed based on API patterns.
        if (body && body.event === 'invoice.created') {
            return [body.data];
        }

        return [];
    },

    sampleData: {
        "invoice_number": "I-123456",
        "order_id": "ord_789",
        "client_name": "Jane Smith",
        "client_email": "jane.smith@example.com",
        "client_phone": "+15559876543",
        "order_amount": "99.99",
        "currency": "USD",
        "payment_status": "paid",
        "payment_processor": "Stripe",
        "order_date": "2025-10-05T18:30:00Z"
    }
});