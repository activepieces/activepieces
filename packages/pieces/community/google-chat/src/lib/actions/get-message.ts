import { createAction, Property } from '@activepieces/pieces-framework';
import {
    HttpMethod,
    httpClient,
    AuthenticationType,
} from '@activepieces/pieces-common';
import { googleChatAuth } from '../..';
import { googleChatCommon, GCHAT_API_URL } from '../common';

export const getMessage = createAction({
    // Use the existing Google Chat authentication
    auth: googleChatAuth,
    name: 'get_message',
    displayName: 'Get Message',
    description: 'Retrieve details of a message.',
    props: {
        // Reuse the dynamic dropdown for selecting a space
        space: googleChatCommon.space,
        message_id: Property.ShortText({
            displayName: 'Message ID',
            description: "The ID of the message to retrieve. You can also provide the full resource name (`spaces/.../messages/...`)",
            required: true,
        }),
    },
    async run(context) {
        const { space, message_id } = context.propsValue;

        // The API endpoint is GET /v1/{name=spaces/*/messages/*}
        // We handle cases where the user provides just the message ID or the full resource name.
        const messageName = message_id.startsWith('spaces/')
            ? message_id
            : `${space}/messages/${message_id}`;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            // Construct the request URL using the base URL and the full message name
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