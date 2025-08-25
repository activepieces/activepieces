import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest, QueryParams } from '@activepieces/pieces-common';
import { clickfunnelsAuth } from '../common/common';

const TRIGGER_DATA_STORE_KEY = 'clickfunnels_new_order_paid_trigger_data';

interface TriggerData {
    last_fetched_id?: number;
}

export const newOrderPaidTrigger = createTrigger({
    auth: clickfunnelsAuth,
    name: 'new_order_paid',
    displayName: 'New One-Time Order Paid',
    description: 'Triggers when a new one-time order is successfully paid.',
    
    props: {
        subdomain: Property.ShortText({
            displayName: 'Workspace Subdomain',
            description: 'The subdomain of your ClickFunnels workspace (e.g., "myworkspace" from myworkspace.myclickfunnels.com).',
            required: true,
        }),
        workspace_id: Property.Number({
            displayName: 'Workspace ID',
            description: 'The ID of the workspace to monitor for new paid orders.',
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
                'filter[invoice_type]': 'one_time_sale',
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
            'filter[invoice_type]': 'one_time_sale',
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
        "id": 9,
        "public_id": "aeIHDh",
        "order_id": 31,
        "status": "paid",
        "due_amount": "0.00",
        "total_amount": "99.99",
        "subtotal_amount": "99.99",
        "tax_amount": "0.00",
        "currency": "USD",
        "issued_at": "2025-06-16T20:25:45.000Z",
        "paid_at": "2025-07-09T20:25:45.000Z",
        "invoice_type": "one_time_sale",
        "invoice_number": "1099",
        "fulfillment_status": "unfulfilled",
        "payment_processor": "payments_ai",
        "eligible_for_fulfillment": true,
        "line_items": [
            {
                "id": 16,
                "public_id": "fJAqze",
                "description": "My Awesome Product",
                "quantity": 1,
                "amount": "99.99"
            }
        ]
    }
});