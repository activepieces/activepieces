import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { kallabotAuth } from '../..';

export const getCallDetailsAction = createAction({
    name: 'get-call-details',
    displayName: 'Get Call Details',
    description: 'Retrieve details of a specific call by call SID.',
    auth: kallabotAuth,
    props: {
        call_sid: Property.ShortText({
            displayName: 'Call SID',
            description: 'The unique identifier of the call.',
            required: true,
        })
    },
    async run(context) {
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `https://api.kallabot.com/v1/call-details/${context.propsValue.call_sid}`,
            headers: {
                'Authorization': `Bearer ${context.auth}`,
                'Content-Type': 'application/json'
            }
        });

        return response.body;
    }
});