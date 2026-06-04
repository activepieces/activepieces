import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, flattenUser } from '../common';

export const listEnabledUsersAction = createAction({
    auth: azureAdAuth,
    name: 'list_enabled_users',
    displayName: 'List Enabled Users',
    description: 'Lists all enabled users in the directory, following nextLink for pagination.',
    props: {
        pageSize: Property.Number({
            displayName: 'Page Size',
            description: 'Number of users per page (1–999). Default 100.',
            required: false,
            defaultValue: 100,
        }),
    },
    async run(context) {
        const token = context.auth.access_token;
        const pageSize = Math.min(999, Math.max(1, context.propsValue.pageSize ?? 100));
        const all: Record<string, unknown>[] = [];
        type Page = { value?: Record<string, unknown>[]; '@odata.nextLink'?: string };
        // https://learn.microsoft.com/en-us/graph/api/user-list?view=graph-rest-1.0&tabs=http
        let url: string | null = `https://graph.microsoft.com/v1.0/users?$filter=accountEnabled eq true&$top=${pageSize}`;
        while (url) {
            const result: Page = await callGraphApi<Page>(token, {
                method: HttpMethod.GET,
                url,
            });
            const list = result.value ?? [];
            all.push(...list.map((u: Record<string, unknown>) => flattenUser(u)));
            url = result['@odata.nextLink'] ?? null;
        }
        return all;
    },
});
