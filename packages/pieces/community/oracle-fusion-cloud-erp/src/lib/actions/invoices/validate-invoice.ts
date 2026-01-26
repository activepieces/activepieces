import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../../index';
import { makeClient } from '../../common/client';

export const validateInvoice = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'validate_invoice',
    displayName: 'Validate Invoice',
    description: 'Validates a payables invoice in Oracle Fusion Cloud ERP.',
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
