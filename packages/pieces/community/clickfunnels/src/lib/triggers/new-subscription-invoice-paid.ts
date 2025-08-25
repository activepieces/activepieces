import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest, QueryParams } from '@activepieces/pieces-common';
import { clickfunnelsAuth } from '../common/common';

const TRIGGER_DATA_STORE_KEY = 'clickfunnels_new_subscription_invoice_paid_trigger_data';

interface TriggerData {
    last_fetched_id?: number;
}

export const newSubscriptionInvoicePaidTrigger = createTrigger({
    auth: clickfunnelsAuth,
    name: 'new_subscription_invoice_paid',
    displayName: 'New Subscription Invoice Paid',
    description: 'Triggers when a new subscription invoice (initial or renewal) is successfully paid.',
    
    props: {
        subdomain: Property.ShortText({
            displayName: 'Workspace Subdomain',
            description: 'The subdomain of your ClickFunnels workspace (e.g., "myworkspace" from myworkspace.myclickfunnels.com).',
            required: true,
        }),
        workspace_id: Property.Number({
            displayName: 'Workspace ID',
            description: 'The ID of the workspace to monitor for new paid subscription invoices.',
            required: true,
        }),
    },

    type: TriggerStrategy.POLLING,

    // onEnable runs once when the trigger is turned on.
    async onEnable(context) {
        const { subdomain, workspace_id } = context.propsValue;

        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `https://${subdomain}.myclickfunnels.com/api/v2/workspaces/${workspace_id}/invoices`,
            headers: { 'Authorization': `Bearer ${context.auth}` },
            queryParams: {
                'sort_order': 'desc',
                'filter[status]': 'paid',
                'filter[invoice_type]': 'initial,renewal', // Filter for subscription types
            }
        };

        const response = await httpClient.sendRequest<any[]>(request);
        const invoices = response.body;

        if (invoices.length > 0) {
            // Store the ID of the most recent paid invoice
            await context.store.put<TriggerData>(TRIGGER_DATA_STORE_KEY, {
                last_fetched_id: invoices[0].id,
            });
        }
    },

    // onDisable runs once when the trigger is turned off.
    async onDisable(context) {
        await context.store.delete(TRIGGER_DATA_STORE_KEY);
    },

    // run is executed on a schedule to check for new data.
    async run(context) {
        const { subdomain, workspace_id } = context.propsValue;
        const triggerData = await context.store.get<TriggerData>(TRIGGER_DATA_STORE_KEY);

        const queryParams: QueryParams = {
            'filter[status]': 'paid',
            'filter[invoice_type]': 'initial,renewal', // Filter for subscription types
        };
        if (triggerData?.last_fetched_id) {
            queryParams['after'] = triggerData.last_fetched_id.toString();
        }

        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `https://${subdomain}.myclickfunnels.com/api/v2/workspaces/${workspace_id}/invoices`,
            headers: { 'Authorization': `Bearer ${context.auth}` },
            queryParams: queryParams
        };

        const response = await httpClient.sendRequest<any[]>(request);
        const newInvoices = response.body;

        if (newInvoices.length > 0) {
            // The last item in the ascending list is the newest
            const latestId = newInvoices[newInvoices.length - 1].id;
            await context.store.put<TriggerData>(TRIGGER_DATA_STORE_KEY, {
                last_fetched_id: latestId,
            });
        }

        return newInvoices;
    },

    // Sample data for the user to map from when building their flow
    sampleData: {
        "id": 10,
        "public_id": "inv_xyz789",
        "order_id": 32,
        "status": "paid",
        "due_amount": "0.00",
        "total_amount": "49.00",
        "subtotal_amount": "49.00",
        "tax_amount": "0.00",
        "currency": "USD",
        "issued_at": "2025-08-16T10:00:00.000Z",
        "paid_at": "2025-08-16T10:00:15.000Z",
        "invoice_type": "renewal",
        "invoice_number": "1100",
        "fulfillment_status": "not_applicable",
        "payment_processor": "payments_ai",
        "eligible_for_fulfillment": false,
        "line_items": [
            {
                "id": 17,
                "public_id": "li_abc456",
                "description": "Pro Membership - Monthly",
                "quantity": 1,
                "amount": "49.00"
            }
        ]
    }
});