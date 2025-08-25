import { createAction, Property } from '@activepieces/pieces-framework';
import {
    HttpMethod,
    httpClient,
    AuthenticationType,
} from '@activepieces/pieces-common';
import { googleChatAuth } from '../..';
import { googleChatCommon, GCHAT_API_URL } from '../common';

export const getDirectMessageDetails = createAction({
    // Use the existing Google Chat authentication
    auth: googleChatAuth,
    name: 'get_message details',
    displayName: 'Get Message Details',
    description: 'Retrieves the details of a specific message from a space.',
    props: {
        // Reuse the dynamic dropdown for selecting a space
        space: googleChatCommon.space,
        message_id: Property.ShortText({
            displayName: 'Message ID',
            description: "The unique identifier of the message. Format: `spaces/{space}/messages/{message}`.",
            required: true,
        }),
    },
    async run(context) {
        const { space, message_id } = context.propsValue;

        // The 'message_id' can be the full resource name, so we construct the URL carefully.
        // The API endpoint is GET /v1/{name=spaces/*/messages/*}
        const messageName = message_id.startsWith('spaces/') ? message_id : `${space}/messages/${message_id}`;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            // Construct the request URL using the base URL and the message name
            url: `${GCHAT_API_URL}/${messageName}`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.access_token,
            },
        });

        // Return the response body, which contains the message details
        return response.body;
    },
});