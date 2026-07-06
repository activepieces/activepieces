import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../auth';
import { makeClient } from '../../common/client';

export const deleteInvoice = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'delete_invoice',
    displayName: 'Delete Invoice',
    description: 'Deletes a payables invoice from Oracle Fusion Cloud ERP.',
    audience: 'both',
    aiMetadata: { description: 'Permanently delete a payables (supplier) invoice by its InvoiceId. Destructive; idempotent in effect since a removed invoice cannot be deleted again. Oracle typically allows deletion only for unvalidated/unpaid invoices; to back out a validated invoice without removing it use Cancel Invoice instead.', idempotent: true },
    props: {
        invoiceId: Property.ShortText({
            displayName: 'Invoice ID',
            description: 'The unique identifier of the invoice to delete.',
            required: true,
        }),
    },
    async run(context) {
        const client = makeClient(context.auth.props);
        const { invoiceId } = context.propsValue;

        await client.deleteRecord(`/invoices/${invoiceId}`);
        return { success: true, message: `Invoice ${invoiceId} deleted successfully.` };
    },
});
