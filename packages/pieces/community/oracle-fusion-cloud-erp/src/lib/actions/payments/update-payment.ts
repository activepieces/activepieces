import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../../index';
import { makeClient } from '../../common/client';

export const updatePayment = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'update_payment',
    displayName: 'Update Payment',
    description: 'Updates descriptive and global flexfields for a payment.',
    props: {
        checkId: Property.ShortText({
            displayName: 'Check ID',
            description: 'The unique identifier of the payment to update.',
            required: true,
        }),
        paymentDescription: Property.LongText({
            displayName: 'Payment Description',
            description: 'Updated description for the payment.',
            required: false,
        }),
        voidDate: Property.ShortText({
            displayName: 'Void Date',
            description: 'The date when the payment is voided (YYYY-MM-DD).',
            required: false,
        }),
        voidAccountingDate: Property.ShortText({
            displayName: 'Void Accounting Date',
            description: 'The date when the voided payment is accounted (YYYY-MM-DD).',
            required: false,
        }),
    },
    async run(context) {
        const client = makeClient(context.auth.props);
        const { checkId, paymentDescription, voidDate, voidAccountingDate } = context.propsValue;

        const payload: Record<string, unknown> = {};

        if (paymentDescription !== undefined && paymentDescription !== '') payload['PaymentDescription'] = paymentDescription;
        if (voidDate) payload['VoidDate'] = voidDate;
        if (voidAccountingDate) payload['VoidAccountingDate'] = voidAccountingDate;

        if (Object.keys(payload).length === 0) {
            throw new Error('At least one field must be provided to update the payment.');
        }

        const response = await client.updateRecord(`/payablesPayments/${checkId}`, payload);
        return response;
    },
});
