import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../auth';
import { makeClient } from '../../common/client';

export const validateInvoice = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'validate_invoice',
    displayName: 'Validate Invoice',
    description: 'Validates a payables invoice in Oracle Fusion Cloud ERP.',
    audience: 'both',
    aiMetadata: { description: 'Run Oracle validation on a payables (supplier) invoice by InvoiceId, checking it and applying any holds so it can proceed to payment. State-changing but effectively idempotent: re-validating an already-validated invoice has no further effect. Use before paying a supplier bill; this does not create or cancel the invoice.', idempotent: true },
    props: {
        invoiceId: Property.ShortText({
            displayName: 'Invoice ID',
            description: 'The unique identifier of the invoice to validate.',
            required: true,
        }),
    },
    async run(context) {
        const client = makeClient(context.auth.props);
        const { invoiceId } = context.propsValue;

        const response = await client.executeAction('/invoices/action/validateInvoice', {
            InvoiceId: invoiceId,
        });
        return response;
    },
});
