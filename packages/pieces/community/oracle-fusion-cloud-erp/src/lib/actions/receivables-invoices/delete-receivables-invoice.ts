import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../auth';
import { makeClient } from '../../common/client';

export const deleteReceivablesInvoice = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'delete_receivables_invoice',
    displayName: 'Delete Receivables Invoice',
    description: 'Deletes a receivables invoice from Oracle Fusion Cloud ERP.',
    audience: 'both',
    aiMetadata: { description: 'Permanently delete an accounts-receivable (customer) invoice by its CustomerTransactionId. Destructive; idempotent in effect since a deleted invoice cannot be deleted again (re-running on a missing ID errors). Use only when the invoice should be fully removed rather than corrected; to change status or fields use Update Receivables Invoice.', idempotent: true },
    props: {
        customerTransactionId: Property.ShortText({
            displayName: 'Customer Transaction ID',
            description: 'The unique identifier of the receivables invoice to delete.',
            required: true,
        }),
    },
    async run(context) {
        const client = makeClient(context.auth.props);
        const { customerTransactionId } = context.propsValue;

        await client.deleteRecord(`/receivablesInvoices/${customerTransactionId}`);
        return { success: true, message: `Receivables invoice ${customerTransactionId} deleted successfully.` };
    },
});
