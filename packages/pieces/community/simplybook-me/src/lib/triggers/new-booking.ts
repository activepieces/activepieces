
import { createTrigger, Property, TriggerStrategy } from "@activepieces/pieces-framework";
import { simplybookMeAuth } from "../common/auth";
import * as crypto from "crypto";

export const newBooking = createTrigger({
    auth: simplybookMeAuth,
    name: 'new_booking',
    displayName: 'New Booking',
    description: 'Fires when a new booking is created in SimplyBook.me.',
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
            1.  Go to your SimplyBook.me dashboard.
            2.  Navigate to **Plugins** and select the **API** plugin.
            3.  Go to the **Webhooks** tab.
            4.  Click **"Add"** to create a new webhook.
            5.  Paste the webhook URL from above into the **URL** field.
            6.  Select the event **booking.created**.
            7.  Save the webhook. A "Webhook Secret" will be generated. Copy this secret and save it in your Authentication settings for this piece.
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
        
        const body = context.payload.body as { event: string, data: unknown };

        if (body && body.event === 'booking.created') {
            return [body.data];
        }

        return [];
    },

    sampleData: {
        "booking_id": "12345",
        "booking_hash": "a1b2c3d4e5f6g7h8",
        "event_id": "1",
        "unit_id": "1",
        "start_datetime": "2025-10-10 10:00:00",
        "end_datetime": "2025-10-10 11:00:00",
        "client": {
            "client_id": "101",
            "name": "John Doe",
            "email": "john.doe@example.com",
            "phone": "1234567890"
        },
    }
});