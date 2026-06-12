import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../auth';
import { makeClient } from '../../common/client';

export const getPayment = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'get_payment',
    displayName: 'Get Payment',
    description: 'Retrieves details of a specific payment by Check ID.',
    audience: 'both',
    aiMetadata: { description: 'Fetch one payables payment by its CheckId. Read-only and idempotent. Use when you already have the payment/check identifier to inspect its status, amount, or payee before voiding or stopping it.', idempotent: true },
    props: {
        checkId: Property.ShortText({
            displayName: 'Check ID',
            description: 'The unique identifier of the payment.',
            required: true,
        }),
    },
    async run(context) {
        const client = makeClient(context.auth.props);
        const { checkId } = context.propsValue;

        const response = await client.getRecord(`/payablesPayments/${checkId}`);
        return response;
    },
});
