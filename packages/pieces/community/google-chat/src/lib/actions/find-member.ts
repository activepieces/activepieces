import { createAction, Property } from '@activepieces/pieces-framework';
import {
    HttpMethod,
    httpClient,
    AuthenticationType,
    HttpRequest,
} from '@activepieces/pieces-common';
import { googleChatAuth } from '../..';
import { googleChatCommon, GCHAT_API_URL } from '../common';

export const findMember = createAction({
    auth: googleChatAuth,
    name: 'find_member',
    displayName: 'Find Member',
    description: 'Find a space member by their email address.',
    props: {
        space: googleChatCommon.space,
        email: Property.ShortText({
            displayName: 'Member Email',
            description: "The email address of the member to find.",
            required: true,
        }),
    },
    async run(context) {
        const { space, email } = context.propsValue;

        const request: HttpRequest = {
            method: HttpMethod.GET,
            // The API allows using the email directly in the URL as an alias for the member ID.
            url: `${GCHAT_API_URL}/${space}/members/${email}`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.access_token,
            },
        };

        // The httpClient will throw an error if the member is not found (404),
        // which will correctly fail the step.
        const response = await httpClient.sendRequest(request);
        
        // If successful, the response body contains the Membership object.
        return response.body;
    },
});