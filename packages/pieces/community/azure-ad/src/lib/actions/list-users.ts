import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, flattenUser } from '../common';

export const listUsersAction = createAction({
    auth: azureAdAuth,
    name: 'list_users',
    displayName: 'List Users',
    description: 'Lists users in the directory. Supports optional filter and top (page size).',
    props: {
        top: Property.Number({
            displayName: 'Top',
            description: 'Maximum number of users to return (1–999). Default 100.',
            required: false,
            defaultValue: 100,
        }),
        filter: Property.ShortText({
            displayName: 'Filter',
            description: 'OData filter (e.g. startswith(displayName,\'A\')). Optional.',
            required: false,
        }),
    },
    async run(context) {
        const token = context.auth.access_token;
        const { top = 100, filter } = context.propsValue;
        const query: Record<string, string> = { $top: String(Math.min(999, Math.max(1, top ?? 100))) };
        if (filter) query['$filter'] = filter;
        // https://learn.microsoft.com/en-us/graph/api/user-list?view=graph-rest-1.0&tabs=http
        const result = await callGraphApi<{ value?: Record<string, unknown>[] }>(token, {
            method: HttpMethod.GET,
            url: 'https://graph.microsoft.com/v1.0/users',
            query,
        });
        const list = result.value ?? [];
        return list.map((u) => flattenUser(u));
    },
});
