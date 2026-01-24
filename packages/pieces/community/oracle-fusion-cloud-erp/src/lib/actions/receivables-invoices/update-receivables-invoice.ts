import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../../index';
import { makeClient } from '../../common/client';

export const updateReceivablesInvoice = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'update_receivables_invoice',
    displayName: 'Update Receivables Invoice',
    description: 'Updates an existing receivables invoice. Note: Only InvoiceStatus, PaymentTerms, and TransactionDate can be updated.',
    props: {
        customerTransactionId: Property.ShortText({
            displayName: 'Customer Transaction ID',
            description: 'The unique identifier of the receivables invoice to update.',
            required: true,
        }),
        invoiceStatus: Property.StaticDropdown({
            displayName: 'Invoice Status',
            description: 'The completion status of the invoice.',
            required: false,
            options: {
                options: [
                    { label: 'Complete', value: 'Complete' },
                    { label: 'Incomplete', value: 'Incomplete' },
                    { label: 'Frozen', value: 'Frozen' },
                ],
            },
        }),
        paymentTerms: Property.ShortText({
            displayName: 'Payment Terms',
            description: 'The payment terms assigned to the invoice.',
            required: false,
        }),
        transactionDate: Property.ShortText({
            displayName: 'Transaction Date',
            description: 'The date when the invoice was created (YYYY-MM-DD).',
            required: false,
        }),
    },
    async run(context) {
        const client = makeClient(context.auth.props);
        const { customerTransactionId, invoiceStatus, paymentTerms, transactionDate } = context.propsValue;

        const payload: Record<string, unknown> = {};

        if (invoiceStatus) payload['InvoiceStatus'] = invoiceStatus;
        if (paymentTerms) payload['PaymentTerms'] = paymentTerms;
        if (transactionDate) payload['TransactionDate'] = transactionDate;

        if (Object.keys(payload).length === 0) {
            throw new Error('At least one field (InvoiceStatus, PaymentTerms, or TransactionDate) must be provided to update.');
        }

        const response = await client.updateRecord(`/receivablesInvoices/${customerTransactionId}`, payload);
        return response;
    },
});
