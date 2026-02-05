import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../../index';
import { makeClient } from '../../common/client';

export const updateInvoice = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'update_invoice',
    displayName: 'Update Invoice',
    description: 'Updates an existing payables invoice. Note: Only certain attributes can be updated and cascade defaulting does not apply.',
    props: {
        invoiceId: Property.ShortText({
            displayName: 'Invoice ID',
            description: 'The unique identifier of the invoice to update.',
            required: true,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'Updated description for the invoice.',
            required: false,
        }),
        paymentTerms: Property.ShortText({
            displayName: 'Payment Terms',
            description: 'Updated payment terms.',
            required: false,
        }),
        payGroup: Property.ShortText({
            displayName: 'Pay Group',
            description: 'Updated pay group.',
            required: false,
        }),
        invoiceGroup: Property.ShortText({
            displayName: 'Invoice Group',
            description: 'Updated invoice group.',
            required: false,
        }),
        paymentMethodCode: Property.ShortText({
            displayName: 'Payment Method Code',
            description: 'Updated payment method code.',
            required: false,
        }),
        remittanceMessageOne: Property.ShortText({
            displayName: 'Remittance Message 1',
            description: 'Remittance message for payment processing.',
            required: false,
        }),
        remittanceMessageTwo: Property.ShortText({
            displayName: 'Remittance Message 2',
            description: 'Additional remittance message.',
            required: false,
        }),
        remittanceMessageThree: Property.ShortText({
            displayName: 'Remittance Message 3',
            description: 'Additional remittance message.',
            required: false,
        }),
    },
    async run(context) {
        const client = makeClient(context.auth.props);
        const {
            invoiceId,
            description,
            paymentTerms,
            payGroup,
            invoiceGroup,
            paymentMethodCode,
            remittanceMessageOne,
            remittanceMessageTwo,
            remittanceMessageThree,
        } = context.propsValue;

        const payload: Record<string, unknown> = {};

        if (description !== undefined && description !== '') payload['Description'] = description;
        if (paymentTerms) payload['PaymentTerms'] = paymentTerms;
        if (payGroup) payload['PayGroup'] = payGroup;
        if (invoiceGroup) payload['InvoiceGroup'] = invoiceGroup;
        if (paymentMethodCode) payload['PaymentMethodCode'] = paymentMethodCode;
        if (remittanceMessageOne) payload['RemittanceMessageOne'] = remittanceMessageOne;
        if (remittanceMessageTwo) payload['RemittanceMessageTwo'] = remittanceMessageTwo;
        if (remittanceMessageThree) payload['RemittanceMessageThree'] = remittanceMessageThree;

        if (Object.keys(payload).length === 0) {
            throw new Error('At least one field must be provided to update the invoice.');
        }

        const response = await client.updateRecord(`/invoices/${invoiceId}`, payload);
        return response;
    },
});
