import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../../index';
import { makeClient } from '../../common/client';

export const getInvoice = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'get_invoice',
    displayName: 'Get Invoice',
    description: 'Retrieves details of a specific payables invoice by ID.',
    props: {
        invoiceId: Property.ShortText({
            displayName: 'Invoice ID',
            description: 'The unique identifier of the invoice (InvoiceId or invoicesUniqID).',
            required: true,
        }),
    },
    async run(context) {
        const client = makeClient(context.auth.props);
        const { invoiceId } = context.propsValue;

        const response = await client.getRecord(`/invoices/${invoiceId}`);
        return response;
    },
});
