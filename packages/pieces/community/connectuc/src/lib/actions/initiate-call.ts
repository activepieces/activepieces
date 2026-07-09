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
    audience: 'both',
    aiMetadata: { description: 'Places an outbound (click-to-call) phone call from a specific ConnectUC device/extension to a destination number, under the given domain and subscriber. Use when an agent needs to ring a user\'s device and connect it to a phone number. Not idempotent: each call starts a new outbound call.', idempotent: false },
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

        const body: Record<string, unknown> = {
            fromUid: device,
            toNumber: toNumber,
        };

        try {
            const response = await connectucApiCall({
                accessToken: context.auth.access_token,
                endpoint: `/users/${user}/activepieces/initiate-call`,
                method: HttpMethod.POST,
                body,
            });

            return response;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to initiate call: ${message}`);
        }
    },
});
