import { Property, createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BASE_URL } from '../common/client';
import { canvaAuth } from '../common/auth';

export const findDesignAction = createAction({
    auth: canvaAuth,
    name: 'find_design',
    displayName: 'Find Design',
    description: 'Search for a design by name to ensure it doesn’t already exist before creating a new one.',
    props: {
        query: Property.ShortText({
            displayName: 'Search Query',
            description: 'Enter the name or keyword of the design to search for.',
            required: true,
        }),
        ownership: Property.StaticDropdown({
            displayName: 'Ownership',
            description: 'Filter designs based on ownership.',
            required: false,
            options: {
                options: [
                    { label: 'Any (Owned or Shared)', value: 'any' },
                    { label: 'Owned', value: 'owned' },
                    { label: 'Shared', value: 'shared' },
                ],
            },
        }),
        sortBy: Property.StaticDropdown({
            displayName: 'Sort By',
            description: 'Sort the list of designs.',
            required: false,
            options: {
                options: [
                    { label: 'Relevance', value: 'relevance' },
                    { label: 'Modified Date (Descending)', value: 'modified_descending' },
                    { label: 'Modified Date (Ascending)', value: 'modified_ascending' },
                    { label: 'Title (Descending)', value: 'title_descending' },
                    { label: 'Title (Ascending)', value: 'title_ascending' },
                ],
            },
        }),
    },
    async run(context) {
        const { query, ownership, sortBy } = context.propsValue;

        const queryParams: Record<string, string> = { query };

        if (ownership) {
            queryParams['ownership'] = ownership;
        }

        if (sortBy) {
            queryParams['sort_by'] = sortBy;
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${BASE_URL}/rest/v1/designs`,
            queryParams,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.access_token,
            },
        });

        return response.body;
    },
});
