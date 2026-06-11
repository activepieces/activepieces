import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../auth';
import { makeClient } from '../../common/client';

export const getReceivablesInvoice = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'get_receivables_invoice',
    displayName: 'Get Receivables Invoice',
    description: 'Retrieves details of a specific receivables invoice by ID.',
    audience: 'both',
    aiMetadata: { description: 'Fetch one accounts-receivable (customer) invoice by its CustomerTransactionId. Read-only and idempotent. Use when you already have the AR invoice ID; to look one up by transaction number, customer, or date range use Find Receivables Invoices first. Distinct from Get Invoice, which retrieves payables (supplier) invoices.', idempotent: true },
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
