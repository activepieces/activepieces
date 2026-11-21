import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, clampLimit, flattenedUserFields, flattenUser } from '../common';

export const listUsersAction = createAction({
    auth: azureAdAuth,
    name: 'list_users',
    classification: 'SEARCH',
    displayName: 'List Users',
    description: 'Lists users, first page only (up to 999), with an optional filter.',
    audience: 'human',
    outputSchema: {
        itemLabel: '{displayName}',
        fields: [{ key: 'users', label: 'Users', value: '', listItems: flattenedUserFields }],
    },
    props: {
        top: Property.Number({
            displayName: 'Top',
            description: 'Users to return. Default 100, max 999.',
            required: false,
            defaultValue: 100,
            advanced: true,
        }),
        filter: Property.ShortText({
            displayName: 'Filter',
            description: 'OData filter. Optional.',
            required: false,
            placeholder: "startswith(displayName,'A')",
            advanced: true,
        }),
    },
    async run(context) {
        const token = context.auth.access_token;
        const { filter } = context.propsValue;
        const query: Record<string, string> = { $top: String(clampLimit({ value: context.propsValue.top, max: 999, fallback: 100 })) };
        if (filter) query['$filter'] = filter;
        const result = await callGraphApi<{ value?: Record<string, unknown>[] }>(token, {
            method: HttpMethod.GET,
            url: '/users',
            query,
        });
        return (result.value ?? []).map((u) => flattenUser(u));
    },
});
