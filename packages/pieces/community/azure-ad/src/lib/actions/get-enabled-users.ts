import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, flattenUser } from '../common';

export const getEnabledUsersAction = createAction({
    auth: azureAdAuth,
    name: 'get_enabled_users',
    displayName: 'Get Enabled Users',
    description: 'Retrieves a single page of enabled users (accountEnabled eq true).',
    props: {
        top: Property.Number({
            displayName: 'Top',
            description: 'Maximum number of users to return (1–999). Default 100.',
            required: false,
            defaultValue: 100,
        }),
    },
    async run(context) {
        const token = context.auth.access_token;
        const top = context.propsValue.top ?? 100;
        // https://learn.microsoft.com/en-us/graph/api/user-list?view=graph-rest-1.0&tabs=http
        const result = await callGraphApi<{ value?: Record<string, unknown>[] }>(token, {
            method: HttpMethod.GET,
            url: 'https://graph.microsoft.com/v1.0/users',
            query: {
                $filter: 'accountEnabled eq true',
                $top: String(Math.min(999, Math.max(1, top))),
            },
        });
        const list = result.value ?? [];
        return list.map((u) => flattenUser(u));
    },
});
