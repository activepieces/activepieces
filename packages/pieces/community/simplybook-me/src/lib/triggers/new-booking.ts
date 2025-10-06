// src/lib/triggers/new-booking.ts

import { createTrigger, Property, TriggerStrategy } from "@activepieces/pieces-framework";
import { simplybookMeAuth } from "../common/auth";
// The 'crypto' import is no longer needed

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
            7.  Save the webhook.
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