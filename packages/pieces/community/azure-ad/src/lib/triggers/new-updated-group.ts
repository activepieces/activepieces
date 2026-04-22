import { HttpMethod } from '@activepieces/pieces-common';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { azureAdAuth } from '../auth';
import { callGraphApi, fetchGraphDeltaChanges } from '../common';

const STORE_KEY = '_delta_link_new_updated_group';
const GROUP_SELECT =
    'id,displayName,description,mail,mailNickname,visibility,groupTypes,securityEnabled,mailEnabled,createdDateTime';

export const newUpdatedGroupTrigger = createTrigger({
    auth: azureAdAuth,
    name: 'new_updated_group',
    displayName: 'New/Updated Group',
    description:
        'Triggers when a group is created or updated in Microsoft Entra ID (e.g. name or description changes).',
    type: TriggerStrategy.POLLING,
    props: {},
    sampleData: {
        id: 'abcdefab-1234-5678-9abc-def012345678',
        displayName: 'Engineering',
        description: 'Engineering department',
        mail: 'engineering@contoso.com',
        mailNickname: 'engineering',
        visibility: 'Private',
        groupTypes: ['Unified'],
        securityEnabled: false,
        mailEnabled: true,
        createdDateTime: '2026-04-22T10:15:30Z',
    },
    async onEnable(context) {
        await fetchGraphDeltaChanges({
            accessToken: context.auth.access_token,
            store: context.store,
            storeKey: STORE_KEY,
            deltaPath: '/groups/delta',
            select: GROUP_SELECT,
        });
    },
    async onDisable(context) {
        await context.store.delete(STORE_KEY);
    },
    async test(context) {
        // https://learn.microsoft.com/en-us/graph/api/group-list?view=graph-rest-1.0&tabs=http
        const res = await callGraphApi<{ value?: unknown[] }>(context.auth.access_token, {
            method: HttpMethod.GET,
            url: '/groups',
            query: { $select: GROUP_SELECT, $top: '3' },
        });
        return res.value ?? [];
    },
    async run(context) {
        return await fetchGraphDeltaChanges({
            accessToken: context.auth.access_token,
            store: context.store,
            storeKey: STORE_KEY,
            deltaPath: '/groups/delta',
            select: GROUP_SELECT,
        });
    },
});
