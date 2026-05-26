import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
    AppConnectionValueForAuthProperty,
    TriggerStrategy,
    createTrigger,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { azureAdAuth } from '../auth';
import { fetchGraphDeltaChanges } from '../common';

const STORE_KEY = '_delta_link_new_user';
const USER_SELECT =
    'id,displayName,userPrincipalName,mail,givenName,surname,jobTitle,mobilePhone,accountEnabled,createdDateTime';

export const newUserTrigger = createTrigger({
    auth: azureAdAuth,
    name: 'new_user',
    displayName: 'New User',
    description: 'Triggers when a new user is created in Microsoft Entra ID.',
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
        await pollingHelper.onEnable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },
    async onDisable(context) {
        await pollingHelper.onDisable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
        await context.store.delete(STORE_KEY);
    },
    async test(context) {
        return await pollingHelper.test(polling, context);
    },
    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});

const polling: Polling<
    AppConnectionValueForAuthProperty<typeof azureAdAuth>,
    Record<string, never>
> = {
    strategy: DedupeStrategy.TIMEBASED,
    // /users/delta avoids the advanced-query restrictions on $filter + createdDateTime,
    // while TIMEBASED dedup on createdDateTime ensures updates to an already-emitted user
    // don't re-fire this trigger (updated users keep their original createdDateTime).
    // https://learn.microsoft.com/en-us/graph/delta-query-users
    async items({ auth, store }) {
        const users = await fetchGraphDeltaChanges<GraphUser>({
            accessToken: auth.access_token,
            store,
            storeKey: STORE_KEY,
            deltaPath: '/users/delta',
            select: USER_SELECT,
        });
        return users
            .filter((u) => u.createdDateTime)
            .map((user) => ({
                epochMilliSeconds: dayjs(user.createdDateTime).valueOf(),
                data: user,
            }));
    },
};

type GraphUser = {
    id: string;
    createdDateTime?: string;
    '@removed'?: unknown;
    [key: string]: unknown;
};
