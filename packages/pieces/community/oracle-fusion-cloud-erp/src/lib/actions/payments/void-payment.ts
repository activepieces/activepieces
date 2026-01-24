import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../../index';
import { makeClient } from '../../common/client';

export const voidPayment = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'void_payment',
    displayName: 'Void Payment',
    description: 'Voids a payment by setting the void date.',
    props: {
        checkId: Property.ShortText({
            displayName: 'Check ID',
            description: 'The unique identifier of the payment to void.',
            required: true,
        }),
        voidDate: Property.ShortText({
            displayName: 'Void Date',
            description: 'The date when the payment is voided (YYYY-MM-DD). Defaults to today.',
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
        const { checkId, voidDate, voidAccountingDate } = context.propsValue;

        const today = new Date().toISOString().split('T')[0];
        
        const payload: Record<string, unknown> = {
            VoidDate: voidDate || today,
        };

        if (voidAccountingDate) payload['VoidAccountingDate'] = voidAccountingDate;

        const response = await client.updateRecord(`/payablesPayments/${checkId}`, payload);
        return response;
    },
});
