import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../../index';
import { makeClient } from '../../common/client';

export const stopPayment = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'stop_payment',
    displayName: 'Stop Payment',
    description: 'Initiates a stop payment request for a payment.',
    props: {
        checkId: Property.ShortText({
            displayName: 'Check ID',
            description: 'The unique identifier of the payment to stop.',
            required: true,
        }),
        stopReason: Property.ShortText({
            displayName: 'Stop Reason',
            description: 'The reason for stopping the payment.',
            required: false,
        }),
        stopReference: Property.ShortText({
            displayName: 'Stop Reference',
            description: 'A reference for the stop payment request.',
            required: false,
        }),
    },
    async run(context) {
        const client = makeClient(context.auth.props);
        const { checkId, stopReason, stopReference } = context.propsValue;

        const payload: Record<string, unknown> = {
            CheckId: checkId,
        };

        if (stopReason) payload['StopReason'] = stopReason;
        if (stopReference) payload['StopReference'] = stopReference;

        const response = await client.executeAction('/payablesPayments/action/initiateStopPayment', payload);
        return response;
    },
});
