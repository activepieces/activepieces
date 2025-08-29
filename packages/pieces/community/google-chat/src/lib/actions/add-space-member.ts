import { createAction, Property } from '@activepieces/pieces-framework';
import {
    HttpMethod,
    httpClient,
    AuthenticationType,
} from '@activepieces/pieces-common';
import { googleChatAuth } from '../..';
import { googleChatCommon, GCHAT_API_URL } from '../common';

export const addSpaceMember = createAction({
    auth: googleChatAuth,
    name: 'add_space_member',
    displayName: 'Add a Space Member',
    description: 'Add a user or a Google Group to a Google Chat space.',
    props: {
        space: googleChatCommon.space,
        member_name: Property.ShortText({
            displayName: 'Member Name',
            description: 'The resource name of the member. Format: `users/{user_email}` or `groups/{group_id}`. Use `users/me` to add the authenticated user.',
            required: true,
        }),
        useAdminAccess: Property.Checkbox({
            displayName: 'Use Admin Access',
            description: "When true, the method runs using the user's Google Workspace administrator privileges. This requires the `chat.admin.memberships` OAuth scope.",
            required: false,
            defaultValue: false,
        }),
    },
    async run(context) {
        const { space, member_name, useAdminAccess } = context.propsValue;

        let formattedName: string;

        // Auto-detect and prefix correctly
        if (member_name.includes('@')) {
            // Treat as email
            formattedName = `users/${member_name}`;
        } else if (/^\d+$/.test(member_name)) {
            // Treat as numeric Google Group ID
            formattedName = `groups/${member_name}`;
        } else if (member_name.startsWith('users/') || member_name.startsWith('groups/')) {
            // Already correctly formatted
            formattedName = member_name;
        } else {
            throw new Error(
                'Invalid member identifier format. Provide an email, numeric group ID, or a full resource name like "users/..." or "groups/...".'
            );
        }

        const requestBody = {
            member: {
                name: formattedName,
                type: 'HUMAN',
            },
        };

        const queryParams: Record<string, string> = {};
        if (useAdminAccess) {
            queryParams['useAdminAccess'] = 'true';
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${GCHAT_API_URL}/${space}/members`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.access_token,
            },
            body: requestBody,
            queryParams: queryParams,
        });

        return response.body;
    },
});