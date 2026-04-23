import { HttpMethod } from '@activepieces/pieces-common';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { azureAdAuth } from '../auth';
import { callGraphApi, fetchGraphDeltaChanges } from '../common';

const STORE_KEY = '_delta_link_new_deleted_user';
const USER_SELECT = 'id,displayName,userPrincipalName,mail,givenName,surname';

export const newDeletedUserTrigger = createTrigger({
    auth: azureAdAuth,
    name: 'new_deleted_user',
    displayName: 'New Deleted User',
    description: 'Triggers when a user is deleted from Microsoft Entra ID.',
    type: TriggerStrategy.POLLING,
    props: {},
    sampleData: {
        id: '12345678-aaaa-bbbb-cccc-1234567890ab',
        '@removed': { reason: 'changed' },
    },
    async onEnable(context) {
        await fetchGraphDeltaChanges({
            accessToken: context.auth.access_token,
            store: context.store,
            storeKey: STORE_KEY,
            deltaPath: '/users/delta',
            select: USER_SELECT,
            shouldInclude: () => false,
        });
    },
    async onDisable(context) {
        await context.store.delete(STORE_KEY);
    },
    async test(context) {
        // /directory/deletedItems doesn't require the advanced-query opt-in when no $filter is used.
        // https://learn.microsoft.com/en-us/graph/api/directory-deleteditems-list?view=graph-rest-1.0&tabs=http
        const res = await callGraphApi<{ value?: unknown[] }>(context.auth.access_token, {
            method: HttpMethod.GET,
            url: '/directory/deletedItems/microsoft.graph.user',
            query: { $select: `${USER_SELECT},deletedDateTime`, $top: '3' },
        });
        return res.value ?? [];
    },
    async run(context) {
        // Graph surfaces soft-deleted users as @removed entries on /users/delta.
        // https://learn.microsoft.com/en-us/graph/delta-query-users#example-4-request-deleted-users
        return await fetchGraphDeltaChanges<DeletedGraphUser>({
            accessToken: context.auth.access_token,
            store: context.store,
            storeKey: STORE_KEY,
            deltaPath: '/users/delta',
            select: USER_SELECT,
            shouldInclude: (item) => Boolean(item['@removed']),
        });
    },
});

type DeletedGraphUser = {
    id: string;
    '@removed'?: { reason?: string } | unknown;
};
