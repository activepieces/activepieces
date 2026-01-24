import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../../index';
import { makeClient } from '../../common/client';

export const getPayment = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'get_payment',
    displayName: 'Get Payment',
    description: 'Retrieves details of a specific payment by Check ID.',
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
