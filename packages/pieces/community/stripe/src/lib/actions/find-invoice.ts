import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';
// CHANGED: Import the specific dropdown you need
import { invoiceIdDropdown } from '../common/props';

export const stripeFindInvoice = createAction({
    name: 'find_invoice',
    auth: stripeAuth,
    displayName: 'Find Invoice',
    description: 'Find an invoice by its ID.',
    props: {
        // CHANGED: Use the imported dropdown directly
        invoice_id: invoiceIdDropdown,
    },
    async run(context) {
        const invoiceId = context.propsValue.invoice_id;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${stripeCommon.baseUrl}/invoices/${invoiceId}`,
            headers: {
                'Authorization': 'Bearer ' + context.auth,
            },
        });

        return response.body;
    },
});