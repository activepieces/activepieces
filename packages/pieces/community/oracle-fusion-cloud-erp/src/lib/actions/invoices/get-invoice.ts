import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../auth';
import { makeClient } from '../../common/client';

export const getInvoice = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'get_invoice',
    displayName: 'Get Invoice',
    description: 'Retrieves details of a specific payables invoice by ID.',
    audience: 'both',
    aiMetadata: { description: 'Fetch one payables (supplier) invoice by its InvoiceId. Read-only and idempotent. Use when you already have the payables invoice ID; to look one up by number, supplier, or status use Find Invoices first. Distinct from Get Receivables Invoice, which retrieves customer-billing (AR) invoices.', idempotent: true },
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
