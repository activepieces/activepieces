import { createAction, Property } from '@activepieces/pieces-framework';
import { connectucAuth } from '../../index';
import { connectucApiCall } from '../common/api-helpers';
import { domainProp, subscriberUuidProp } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const doNotDisturbAction = createAction({
    auth: connectucAuth,
    name: 'do-not-disturb',
    displayName: 'Set Do Not Disturb',
    description: 'Enable or disable Do Not Disturb status for a user in ConnectUC',
    props: {
        domain: domainProp(),
        user: subscriberUuidProp(),
        dnd: Property.Checkbox({
            displayName: 'Do Not Disturb',
            description: 'Enable or disable Do Not Disturb status',
            required: true,
        }),
    },
    async run(context) {
        const { user, dnd } = context.propsValue;

        const body: Record<string, unknown> = {
            dnd: dnd,
        };

        try {
            const response = await connectucApiCall({
                accessToken: context.auth.access_token,
                endpoint: `/users/${user}/dnd/update`,
                method: HttpMethod.POST,
                body,
            });

            return response;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to set Do Not Disturb status: ${message}`);
        }
    },
});
