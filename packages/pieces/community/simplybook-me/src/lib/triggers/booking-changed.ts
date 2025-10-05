

import { createTrigger, Property, TriggerStrategy } from "@activepieces/pieces-framework";
import { simplybookMeAuth } from "../common/auth";
import { simplybookMeProps } from "../common/props";
import * as crypto from "crypto";

interface BookingChangedPayload {
    event: string;
    data: {
        booking_id: string;
        event_id: string;
        unit_id: string;
        [key: string]: unknown;
    }
}

export const bookingChanged = createTrigger({
    auth: simplybookMeAuth,
    name: 'booking_changed',
    displayName: 'Booking Changed',
    description: 'Fires when booking details change (e.g., date, time, status, etc.).',
    props: {
        serviceId: simplybookMeProps.serviceId(false),
        unitId: simplybookMeProps.unitId(false),
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
            4.  Select the event **Booking Change**.
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
        
        const body = context.payload.body as BookingChangedPayload;
        const { serviceId, unitId } = context.propsValue;


        if (body && body.event === 'booking.changed') {
            const serviceMatch = !serviceId || body.data.event_id === serviceId;
            const unitMatch = !unitId || body.data.unit_id === unitId;

            if (serviceMatch && unitMatch) {
                return [body.data];
            }
        }

        return [];
    },

    sampleData: {
        "booking_id": "12345",
        "booking_hash": "a1b2c3d4e5f6g7h8",
        "event_id": "1",
        "unit_id": "1",
        "start_datetime": "2025-10-11 14:00:00",
        "end_datetime": "2025-10-11 15:00:00",
        "client": {
            "client_id": "101",
            "name": "Jane Doe",
            "email": "jane.doe@example.com",
            "phone": "9876543210"
        },
        "status": "confirmed"
    }
});