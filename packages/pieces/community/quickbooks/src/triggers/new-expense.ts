import {
    Property,
    TriggerStrategy,
    createTrigger,
    TriggerHookContext,
} from "@activepieces/pieces-framework";
import crypto from 'node:crypto';
import { quickbooksAuth } from '../index';

interface QuickBooksEntity {
    name: string;
    id: string;
    operation: string;
    lastUpdated: string;
}

interface QuickBooksWebhookPayload {
    eventNotifications: {
        realmId: string;
        dataChangeEvent?: {
            entities: QuickBooksEntity[];
        };
    }[];
}

const markdownDescription = `
**Setup Instructions:**

1.  **Copy the Webhook URL:** Copy the URL provided below.
2.  **QuickBooks Developer Dashboard:** Log in to your QuickBooks Developer dashboard.
3.  **Select App:** Navigate to the dashboard and select the relevant app.
4.  **Add Webhook Endpoint:** Go to the "Webhooks" section (under Production or Development, as appropriate).
5.  **Paste URL:** Paste the copied Webhook URL into the "Endpoint URL" field.
6.  **Select Events:** Choose the **Purchase** entity and select the desired operations (e.g., Create, Update). **Ensure you select at least the 'Create' event for this trigger.** This trigger fires when an expense (Purchase) is recorded.
7.  **Get Verifier Token:** After saving, QuickBooks will provide a "Verifier token".
8.  **Paste Verifier Token:** Paste this token into the "Webhook Verifier Token" field below in this trigger setup.
9.  **Save Trigger:** Save this Activepieces trigger configuration.

**Important:** Ensure your Activepieces flow is **published** for the webhook to function correctly. QuickBooks requires the endpoint to be active.
`;

export const newExpense = createTrigger({
    auth: quickbooksAuth,
    name: 'new_expense',
    displayName: 'New or Updated Expense (Purchase) (Webhook)',
    description: 'Triggers when an Expense (Purchase) is created or updated in QuickBooks (requires webhook setup).',
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
        await context.store.put('quickbooks_expense_verifier_token', verifierToken); // Unique store key
        console.info(`QuickBooks 'New Expense' Webhook Enabled. User needs to configure endpoint in QuickBooks UI: ${context.webhookUrl}`);
    },
    async onDisable(context: TriggerHookContext<typeof quickbooksAuth, Record<string, any>, TriggerStrategy.WEBHOOK>): Promise<void> {
        await context.store.delete('quickbooks_expense_verifier_token'); // Unique store key
        console.info(`QuickBooks 'New Expense' Webhook Disabled. Please manually remove the webhook from your QuickBooks Developer Dashboard: ${context.webhookUrl}`);
    },
    async run(context: TriggerHookContext<typeof quickbooksAuth, Record<string, any>, TriggerStrategy.WEBHOOK>): Promise<QuickBooksEntity[]> {
        const signature = context.payload.headers['intuit-signature'] as string | undefined;
        const bodyString = JSON.stringify(context.payload.body);
        const storedToken = await context.store.get<string>('quickbooks_expense_verifier_token'); // Unique store key

        if (!signature) {
            console.warn("Signature missing from QuickBooks webhook request.");
            throw new Error("Forbidden: Missing intuit-signature header.");
        }

        if (!storedToken) {
            console.error("Verifier token not found in store. Trigger might need re-enabling.");
            throw new Error("Internal Error: Verifier token not configured.");
        }

        const hash = crypto.createHmac('sha256', storedToken).update(bodyString).digest('base64');

        if (signature !== hash) {
            console.warn("Invalid signature received from QuickBooks webhook. Expected:", hash, "Received:", signature);
            throw new Error("Forbidden: Invalid intuit-signature.");
        }

        console.log('QuickBooks Expense/Purchase Webhook Payload Received & Verified:', context.payload.body);

        const notificationPayload = context.payload.body as QuickBooksWebhookPayload;
        if (!notificationPayload?.eventNotifications?.length) {
            console.log("Received empty or invalid payload structure from QuickBooks.");
            return [];
        }

        const relevantEntities: QuickBooksEntity[] = [];
        for (const notification of notificationPayload.eventNotifications) {
            if (notification.dataChangeEvent?.entities) {
                for (const entity of notification.dataChangeEvent.entities) {
                    if (entity.name === 'Purchase') { // Filter for Purchase entity
                        relevantEntities.push(entity);
                    }
                }
            }
        }

        if (relevantEntities.length === 0) {
            console.log("No relevant Purchase entities found in the webhook payload.");
            return [];
        }

        // Note: The payload only contains the ID. User will need a subsequent
        // action step (like 'Create Expense' maybe? Or a generic 'Get Purchase' if we add it)
        // to get full details.
        console.log(`Returning ${relevantEntities.length} expense/purchase events.`);
        return relevantEntities;
    },
    sampleData: {
        "eventNotifications": [
            {
                "realmId": "9130352061586111",
                "dataChangeEvent": {
                    "entities": [
                        {
                            "name": "Purchase",
                            "id": "789",
                            "operation": "Create",
                            "lastUpdated": "2024-07-31T14:00:00Z"
                        }
                    ]
                }
            }
        ]
    },
}); 