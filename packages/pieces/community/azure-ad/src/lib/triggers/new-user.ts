import { HttpMethod } from '@activepieces/pieces-common';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
    AppConnectionValueForAuthProperty,
    TriggerStrategy,
    createTrigger,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { azureAdAuth } from '../auth';
import { callGraphApi } from '../common';

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
    async items({ auth, lastFetchEpochMS }) {
        const query: Record<string, string> = {
            $select: USER_SELECT,
            $orderby: 'createdDateTime desc',
            $top: '50',
        };
        if (lastFetchEpochMS !== 0) {
            query['$filter'] = `createdDateTime gt ${dayjs(lastFetchEpochMS).toISOString()}`;
        }
        // https://learn.microsoft.com/en-us/graph/api/user-list?view=graph-rest-1.0&tabs=http
        const res = await callGraphApi<{ value?: GraphUser[] }>(auth.access_token, {
            method: HttpMethod.GET,
            url: '/users',
            query,
        });
        return (res.value ?? [])
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
    [key: string]: unknown;
};
