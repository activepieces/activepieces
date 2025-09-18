import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findAccount = createAction({
    auth: frontAuth,
    name: 'find_account',
    displayName: 'Find Account',
    description: 'Search for an existing account by its domain or external ID.',
    props: {
        search_by: Property.StaticDropdown({
            displayName: 'Search By',
            description: 'The field to search for the account by.',
            required: true,
            options: {
                options: [
                    { label: 'Domain', value: 'domain' },
                    { label: 'External ID', value: 'external_id' },
                ],
            },
        }),
        search_value: Property.ShortText({
            displayName: 'Search Value',
            description: "The value to search for (e.g., 'example.com' or 'your-external-id').",
            required: true,
        }),
    },
    async run(context) {
        const { search_by, search_value } = context.propsValue;
        const token = context.auth;


        const accountAlias = `alt:${search_by}:${search_value}`;

        return await makeRequest(
            token,
            HttpMethod.GET,
            `/accounts/${accountAlias}`
        );
    },
});