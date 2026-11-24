import { createAction, Property } from '@activepieces/pieces-framework';
import { azureAdAuth } from '../auth';
import { clampLimit, fetchAllGraphPages, flattenedUserFields, flattenUser } from '../common';

const MAX_PAGES = 50;

export const listEnabledUsersAction = createAction({
    auth: azureAdAuth,
    name: 'list_enabled_users',
    classification: 'SEARCH',
    displayName: 'List Enabled Users',
    description: `Lists all enabled users, every page (up to ${MAX_PAGES} pages).`,
    audience: 'human',
    outputSchema: {
        itemLabel: '{displayName}',
        fields: [{ key: 'users', label: 'Users', value: '', listItems: flattenedUserFields }],
    },
    props: {
        pageSize: Property.Number({
            displayName: 'Page Size',
            description: 'Users per request. Default 100, max 999.',
            required: false,
            defaultValue: 100,
            advanced: true,
        }),
    },
    async run(context) {
        const pageSize = clampLimit({ value: context.propsValue.pageSize, max: 999, fallback: 100 });
        const users = await fetchAllGraphPages<Record<string, unknown>>({
            accessToken: context.auth.access_token,
            url: '/users',
            query: { $filter: 'accountEnabled eq true', $top: String(pageSize) },
            maxPages: MAX_PAGES,
            tooManyMessage: `More than ${MAX_PAGES} pages of ${pageSize} enabled users exist. Raise Page Size (max 999) or use Get Enabled Users / Custom API Call to page manually.`,
        });
        return users.map((u) => flattenUser(u));
    },
});
