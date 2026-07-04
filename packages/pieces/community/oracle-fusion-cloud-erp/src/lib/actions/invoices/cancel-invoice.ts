import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../auth';
import { makeClient } from '../../common/client';

export const cancelInvoice = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'cancel_invoice',
    displayName: 'Cancel Invoice',
    description: 'Cancels a payables invoice in Oracle Fusion Cloud ERP.',
    audience: 'both',
    aiMetadata: { description: 'Cancel a payables (supplier) invoice by InvoiceId, voiding its amount so it is no longer payable. State-changing; effectively idempotent since an already-cancelled invoice stays cancelled, though a paid or validated invoice may be rejected by Oracle. Use to back out a supplier bill in place; to remove it entirely use Delete Invoice.', idempotent: true },
    props: {
        invoiceId: Property.ShortText({
            displayName: 'Invoice ID',
            description: 'The unique identifier of the invoice to cancel.',
            required: true,
        }),
    },
    async run(context) {
        const client = makeClient(context.auth.props);
        const { invoiceId } = context.propsValue;

        const response = await client.executeAction('/invoices/action/cancelInvoice', {
            InvoiceId: invoiceId,
        });
        return response;
    },
});
