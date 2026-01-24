import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../../index';
import { makeClient } from '../../common/client';

export const cancelInvoice = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'cancel_invoice',
    displayName: 'Cancel Invoice',
    description: 'Cancels a payables invoice in Oracle Fusion Cloud ERP.',
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
