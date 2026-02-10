import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../../index';
import { makeClient } from '../../common/client';

export const deleteReceivablesInvoice = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'delete_receivables_invoice',
    displayName: 'Delete Receivables Invoice',
    description: 'Deletes a receivables invoice from Oracle Fusion Cloud ERP.',
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
