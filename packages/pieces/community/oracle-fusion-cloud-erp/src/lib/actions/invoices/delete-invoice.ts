import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../../index';
import { makeClient } from '../../common/client';

export const deleteInvoice = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'delete_invoice',
    displayName: 'Delete Invoice',
    description: 'Deletes a payables invoice from Oracle Fusion Cloud ERP.',
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
