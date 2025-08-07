import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const findUserAction = createAction({
    auth: pipedriveAuth,
    name: 'find-user',
    displayName: 'Find User',
    description: 'Finds a user by name or email using Pipedrive API v2.', // ✅ Updated description for v2
    props: {
        field: Property.StaticDropdown({
            displayName: 'Field to search by',
            required: true,
            options: {
                disabled: false,
                options: [
                    {
                        label: 'Name',
                        value: 'name',
                    },
                    {
                        label: 'Email',
                        value: 'email',
                    },
                ],
            },
        }),
        fieldValue: Property.ShortText({
            displayName: 'Field Value',
            required: true,
        }),
    },
    async run(context) {
        const { field, fieldValue } = context.propsValue;

        // In Pipedrive API v2, the endpoint for finding users by term or email is `/v2/users/find`.
        // The `search_by_email` parameter now expects a boolean (true/false) instead of 1/0.
        const response = await pipedriveApiCall<{ success: boolean; data: Array<Record<string, any>> }>(
            {
                accessToken: context.auth.access_token,
                apiDomain: context.auth.data['api_domain'],
                method: HttpMethod.GET,
                resourceUri: '/v2/users/find', // ✅ Updated to v2 endpoint
                query: {
                    term: fieldValue,
                    // ✅ 'search_by_email' now expects a boolean (true/false)
                    search_by_email: field === 'email' ? true : false,
                },
            },
        );

        // The response structure for /users/find typically returns an array of user objects directly in 'data'.
        // The original logic for checking response.data.length and returning 'found' is compatible.
        return {
            found: response.data && response.data.length > 0, // Simplified check for 'found'
            data: response.data,
        };
    },
});
