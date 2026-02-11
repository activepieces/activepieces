import { createAction, Property } from '@activepieces/pieces-framework';
import { connectucAuth } from '../../index';
import { connectucApiCall } from '../common/api-helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const initiateCallAction = createAction({
    auth: connectucAuth,
    name: 'initiate-call',
    displayName: 'Initiate Call',
    description: 'Initiate an outbound call from a ConnectUC extension',
    props: {
        uid: Property.ShortText({
            displayName: 'UID',
            description: 'The user ID in the format of user@domain',
            required: true,
        }),
        fromUid: Property.ShortText({
            displayName: 'From UID',
            description: 'The origin extension and domain of the call',
            required: true,
        }),
        toNumber: Property.ShortText({
            displayName: 'To Number',
            description: 'The destination number of the call',
            required: true,
        }),
        callerId: Property.ShortText({
            displayName: 'Caller ID',
            description: 'The caller ID to display for the call',
            required: false,
        }),
    },
    async run(context) {
        const { uid, fromUid, toNumber, callerId } = context.propsValue;

        // Build request body
        const body: Record<string, unknown> = {
            fromUid: fromUid,
            toNumber: toNumber,
        };

        // Add optional caller ID if provided
        if (callerId) {
            body['callerId'] = callerId;
        }

        try {
            // Make API call to initiate call
            const response = await connectucApiCall({
                accessToken: context.auth.access_token,
                endpoint: `/users/${uid}/activepieces/initiate-call`,
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
