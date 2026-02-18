import { createAction, Property } from '@activepieces/pieces-framework';
import { connectucAuth } from '../../index';
import { connectucApiCall } from '../common/api-helpers';
import { domainProp, subscriberUuidProp, deviceProp } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const initiateCallAction = createAction({
    auth: connectucAuth,
    name: 'initiate-call',
    displayName: 'Initiate Call',
    description: 'Initiate an outbound call from a ConnectUC extension',
    props: {
        domain: domainProp(),
        user: subscriberUuidProp(),
        device: deviceProp(),
        toNumber: Property.ShortText({
            displayName: 'To Number',
            description: 'The destination number of the call',
            required: true,
        }),
    },
    async run(context) {
        const { user, device, toNumber } = context.propsValue;

        // Build request body
        const body: Record<string, unknown> = {
            fromUid: device,
            toNumber: toNumber,
        };

        try {
            // Make API call to initiate call
            const response = await connectucApiCall({
                accessToken: context.auth.access_token,
                endpoint: `/users/${user}/activepieces/initiate-call`,
                method: HttpMethod.POST,
                body,
            });

            return response;
        } catch (error: unknown) {
            // Provide helpful error message
            const err = error as { response?: { body?: { message?: string } }; message?: string };
            const errorMessage = err.response?.body?.message || err.message || 'Unknown error occurred';
            throw new Error(`Failed to initiate call: ${errorMessage}`);
        }
    },
});
