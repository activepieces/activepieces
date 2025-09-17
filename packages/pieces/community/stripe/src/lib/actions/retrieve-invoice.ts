import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';
import { stripeProps } from '../common/props';

export const stripeRetrieveInvoice = createAction({
    name: 'retrieve_invoice',
    auth: stripeAuth,
    displayName: 'Retrieve Invoice',
    description: 'Retrieves the details of an existing invoice.',
    props: {
        invoice: stripeProps.invoice(),
    },
    async run(context) {
        const invoiceId = context.propsValue.invoice;

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