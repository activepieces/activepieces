import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, clampLimit, flattenedUserFields, flattenUser } from '../common';

export const getEnabledUsersAction = createAction({
    auth: azureAdAuth,
    name: 'get_enabled_users',
    classification: 'SEARCH',
    displayName: 'Get Enabled Users',
    description: 'Gets enabled users, first page only (up to 999).',
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
    },
    async run(context) {
        const token = context.auth.access_token;
        const top = clampLimit({ value: context.propsValue.top, max: 999, fallback: 100 });
        const result = await callGraphApi<{ value?: Record<string, unknown>[] }>(token, {
            method: HttpMethod.GET,
            url: '/users',
            query: {
                $filter: 'accountEnabled eq true',
                $top: String(top),
            },
        });
        return (result.value ?? []).map((u) => flattenUser(u));
    },
});
