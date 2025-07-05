import { createAction } from '@activepieces/pieces-framework';
import { airtopApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { airtopAuth } from '../../index';
import { sessionIdDropdown } from '../common/props';

export const airtopTerminateSessionAction = createAction({
    auth: airtopAuth,
    name: 'airtop_terminate_session',
    displayName: 'Terminate Session',
    description: 'Ends an existing browser session in Airtop.',
    props: {
        sessionId: sessionIdDropdown,
    },
    async run({ auth, propsValue }) {
        const sessionId = propsValue['sessionId'];
        if (!sessionId) {
            throw new Error('Session ID is required to terminate a session.');
        }
        const response = await airtopApiCall<any>({
            apiKey: auth as string,
            method: HttpMethod.DELETE,
            resourceUri: `/sessions/${sessionId}`,
        });

        return {
            success: true,
            message: `Session ${sessionId} terminated.`,
            response,
        };
    },
});
