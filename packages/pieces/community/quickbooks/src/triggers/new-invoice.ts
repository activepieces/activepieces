import {
    Property,
    TriggerStrategy,
    createTrigger,
    TriggerHookContext,
} from "@activepieces/pieces-framework";
import crypto from 'node:crypto';
import { quickbooksAuth } from '../index';

const markdownDescription = `
**Setup Instructions:**

1.  **Copy the Webhook URL:** Copy the URL provided below.
2.  **QuickBooks Developer Dashboard:** Log in to your QuickBooks Developer dashboard.
3.  **Select App:** Navigate to the dashboard and select the relevant app.
4.  **Add Webhook Endpoint:** Go to the "Webhooks" section (under Production or Development, as appropriate).
5.  **Paste URL:** Paste the copied Webhook URL into the "Endpoint URL" field.
6.  **Select Events:** Choose the "Invoice" entity and select the desired operations (e.g., Create, Update, Paid). **Ensure you select at least the 'Create' event for this trigger.**
7.  **Get Verifier Token:** After saving, QuickBooks will provide a "Verifier token".
8.  **Paste Verifier Token:** Paste this token into the "Webhook Verifier Token" field below in this trigger setup.
9.  **Save Trigger:** Save this Activepieces trigger configuration.

**Important:** Ensure your Activepieces flow is **published** for the webhook to function correctly. QuickBooks requires the endpoint to be active.
`;

export const newInvoice = createTrigger({
    auth: quickbooksAuth,
    name: 'new_invoice',
    displayName: 'New or Updated Invoice (Webhook)',
    description: 'Triggers when an invoice is created or updated in QuickBooks (requires webhook setup).',
    props: {
        description: Property.MarkDown({
            value: markdownDescription,
        }),
        verifier_token: Property.ShortText({
            displayName: 'Webhook Verifier Token',
            description: 'Paste the Verifier Token provided by QuickBooks here. This is sensitive.',
            required: true,
        }),
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context: TriggerHookContext<typeof quickbooksAuth, Record<string, any>, TriggerStrategy.WEBHOOK>): Promise<void> {
        const verifierToken = context.propsValue['verifier_token'] as string;
        await context.store.put('quickbooks_invoice_verifier_token', verifierToken);
        console.info(`QuickBooks 'New Invoice' Webhook Enabled. User needs to configure endpoint in QuickBooks UI: ${context.webhookUrl}`);
    },
    async onDisable(context: TriggerHookContext<typeof quickbooksAuth, Record<string, any>, TriggerStrategy.WEBHOOK>): Promise<void> {
        await context.store.delete('quickbooks_invoice_verifier_token');
        console.info(`QuickBooks 'New Invoice' Webhook Disabled. Please manually remove the webhook from your QuickBooks Developer Dashboard: ${context.webhookUrl}`);
    },
    async run(context: TriggerHookContext<typeof quickbooksAuth, Record<string, any>, TriggerStrategy.WEBHOOK>): Promise<QuickBooksEntity[]> {
        const signature = context.payload.headers['intuit-signature'] as string | undefined;
        const bodyString = JSON.stringify(context.payload.body);
        const storedToken = await context.store.get<string>('quickbooks_invoice_verifier_token');

        if (!signature) {
            console.warn("Signature missing from QuickBooks webhook request.");
            throw new Error("Forbidden: Missing intuit-signature header.");
        }

        if (!storedToken) {
            console.error("Verifier token not found in store. Trigger might need re-enabling.");
            throw new Error("Internal Error: Verifier token not configured.");
        }

        // Verify the signature
        const hash = crypto.createHmac('sha256', storedToken).update(bodyString).digest('base64');

        if (signature !== hash) {
            console.warn("Invalid signature received from QuickBooks webhook. Expected:", hash, "Received:", signature);
            throw new Error("Forbidden: Invalid intuit-signature.");
        }

        console.log('QuickBooks Webhook Payload Received & Verified:', context.payload.body);

        // Process the payload
        const notificationPayload = context.payload.body as QuickBooksWebhookPayload;
        if (!notificationPayload?.eventNotifications?.length) {
            console.log("Received empty or invalid payload structure from QuickBooks.");
            return [];
        }

        const relevantEntities: QuickBooksEntity[] = [];
        for (const notification of notificationPayload.eventNotifications) {
            if (notification.dataChangeEvent?.entities) {
                for (const entity of notification.dataChangeEvent.entities) {
                    if (entity.name === 'Invoice') {
                        relevantEntities.push(entity);
                    }
                }
            }
        }

        if (relevantEntities.length === 0) {
            console.log("No relevant Invoice entities found in the webhook payload.");
            return [];
        }

        console.log(`Returning ${relevantEntities.length} invoice events.`);
        return relevantEntities;
    },
    sampleData: {
        "eventNotifications": [
            {
                "realmId": "123146188800111",
                "dataChangeEvent": {
                    "entities": [
                        {
                            "name": "Invoice",
                            "id": "190",
                            "operation": "Create",
                            "lastUpdated": "2024-07-30T10:30:00Z"
                        }
                    ]
                }
            }
        ]
    },
});

interface QuickBooksWebhookPayload {
    eventNotifications: QuickBooksEventNotification[];
}

interface QuickBooksEventNotification {
    realmId: string;
    dataChangeEvent?: QuickBooksDataChangeEvent;
}

interface QuickBooksDataChangeEvent {
    entities: QuickBooksEntity[];
}

interface QuickBooksEntity {
    name: string;
    id: string;
    operation: string;
    lastUpdated: string;
}