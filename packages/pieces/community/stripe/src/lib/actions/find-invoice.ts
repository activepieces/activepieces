import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';
import { stripeProps } from '../common/props';

export const stripeFindInvoice = createAction({
    name: 'find_invoice',
    auth: stripeAuth,
    displayName: 'Find Invoice',
    description: 'Find an invoice by its ID.',
    props: {
        invoice_id: stripeProps.invoice(),
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