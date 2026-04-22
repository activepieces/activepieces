import { HttpMethod } from '@activepieces/pieces-common';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { azureAdAuth } from '../auth';
import { callGraphApi, fetchGraphDeltaChanges } from '../common';

const STORE_KEY = '_delta_link_new_updated_user';
const USER_SELECT =
    'id,displayName,userPrincipalName,mail,givenName,surname,jobTitle,mobilePhone,accountEnabled,createdDateTime';

export const newUpdatedUserTrigger = createTrigger({
    auth: azureAdAuth,
    name: 'new_updated_user',
    displayName: 'New/Updated User',
    description: 'Triggers when a user is created or updated in Microsoft Entra ID.',
    type: TriggerStrategy.POLLING,
    props: {},
    sampleData: {
        id: '12345678-aaaa-bbbb-cccc-1234567890ab',
        displayName: 'Ada Lovelace',
        userPrincipalName: 'ada@contoso.onmicrosoft.com',
        mail: 'ada@contoso.com',
        givenName: 'Ada',
        surname: 'Lovelace',
        jobTitle: 'Mathematician',
        mobilePhone: '+1 555 0100',
        accountEnabled: true,
        createdDateTime: '2026-04-22T10:15:30Z',
    },
    async onEnable(context) {
        await fetchGraphDeltaChanges({
            accessToken: context.auth.access_token,
            store: context.store,
            storeKey: STORE_KEY,
            deltaPath: '/users/delta',
            select: USER_SELECT,
        });
    },
    async onDisable(context) {
        await context.store.delete(STORE_KEY);
    },
    async test(context) {
        // https://learn.microsoft.com/en-us/graph/api/user-list?view=graph-rest-1.0&tabs=http
        const res = await callGraphApi<{ value?: unknown[] }>(context.auth.access_token, {
            method: HttpMethod.GET,
            url: '/users',
            query: { $select: USER_SELECT, $top: '3' },
        });
        return res.value ?? [];
    },
    async run(context) {
        return await fetchGraphDeltaChanges({
            accessToken: context.auth.access_token,
            store: context.store,
            storeKey: STORE_KEY,
            deltaPath: '/users/delta',
            select: USER_SELECT,
        });
    },
});
