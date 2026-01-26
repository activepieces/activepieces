import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../../index';
import { makeClient } from '../../common/client';

export const getReceivablesInvoice = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'get_receivables_invoice',
    displayName: 'Get Receivables Invoice',
    description: 'Retrieves details of a specific receivables invoice by ID.',
    props: {
        customerTransactionId: Property.ShortText({
            displayName: 'Customer Transaction ID',
            description: 'The unique identifier of the receivables invoice.',
            required: true,
        }),
    },
    async run(context) {
        const client = makeClient(context.auth.props);
        const { customerTransactionId } = context.propsValue;

        const response = await client.getRecord(`/receivablesInvoices/${customerTransactionId}`);
        return response;
    },
});
