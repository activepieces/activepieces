import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { stripeCommon } from '../common';
import { stripeAuth } from '../..';
// CHANGED: Import the specific dropdowns you need
import { customerIdDropdown ,subscriptionIdDropdown } from '../common';

export const stripeNewInvoice = createTrigger({
    auth: stripeAuth,
    name: 'new_invoice',
    displayName: 'New Invoice',
    description: 'Fires when a new invoice is created.',
    props: {
        status: Property.StaticMultiSelectDropdown({
            displayName: 'Status',
            description: 'Only trigger for invoices with a specific status. Leave blank for all.',
            required: false,
            options: {
                options: [
                    { label: 'Draft', value: 'draft' },
                    { label: 'Open', value: 'open' },
                    { label: 'Paid', value: 'paid' },
                    { label: 'Void', value: 'void' },
                    { label: 'Uncollectible', value: 'uncollectible' },
                ]
            }
        }),
        // CHANGED: Use the imported dropdown and override the 'required' property
        customer: {
            ...customerIdDropdown,
            required: false,
        },
        subscription: {
            ...subscriptionIdDropdown,
            required: false,
        },
    },
    sampleData: {
        "id": "in_1OaG8y2eZvKYlo2CU90f8mBC",
        "object": "invoice",
        "customer": "cus_123456789",
        "subscription": "sub_123456789",
        "status": "paid",
        "amount_due": 1000,
        "amount_paid": 1000,
        "amount_remaining": 0,
        "currency": "usd",
        "created": 1702588182,
        "due_date": 1705180182,
        "hosted_invoice_url": "https://invoice.stripe.com/i/...",
        "invoice_pdf": "https://pay.stripe.com/invoice/...",
        "paid": true,
        "total": 1000
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const webhook = await stripeCommon.subscribeWebhook(
            ['invoice.created'],
            context.webhookUrl,
            context.auth
        );
        await context.store.put<WebhookInformation>('_new_invoice_trigger', {
            webhookId: webhook.id,
        });
    },
    async onDisable(context) {
        const response = await context.store.get<WebhookInformation>(
            '_new_invoice_trigger'
        );
        if (response !== null && response !== undefined) {
            await stripeCommon.unsubscribeWebhook(response.webhookId, context.auth);
        }
    },
    async run(context) {
        const invoice = (context.payload.body as PayloadBody).data.object;

        const statusFilter = context.propsValue.status;
        const customerFilter = context.propsValue.customer;
        const subscriptionFilter = context.propsValue.subscription;

        // If no filters are set, always trigger
        if (!statusFilter?.length && !customerFilter && !subscriptionFilter) {
            return [invoice];
        }

        // Apply filters
        if (customerFilter && invoice.customer !== customerFilter) {
            return [];
        }
        if (subscriptionFilter && invoice.subscription !== subscriptionFilter) {
            return [];
        }
        if (statusFilter && statusFilter.length > 0 && !statusFilter.includes(invoice.status)) {
            return [];
        }
        
        // If the invoice passes all configured filters, return it
        return [invoice];
    },
});

type PayloadBody = {
    data: {
        object: {
            customer?: string;
            subscription?: string;
            status: string;
        };
    };
};

interface WebhookInformation {
    webhookId: string;
}