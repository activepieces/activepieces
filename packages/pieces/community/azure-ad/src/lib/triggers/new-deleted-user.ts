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

const DELETED_USER_SELECT =
    'id,displayName,userPrincipalName,mail,givenName,surname,deletedDateTime';

export const newDeletedUserTrigger = createTrigger({
    auth: azureAdAuth,
    name: 'new_deleted_user',
    displayName: 'New Deleted User',
    description: 'Triggers when a user is deleted from Microsoft Entra ID.',
    type: TriggerStrategy.POLLING,
    props: {},
    sampleData: {
        id: '12345678-aaaa-bbbb-cccc-1234567890ab',
        displayName: 'Ada Lovelace',
        userPrincipalName: 'ada@contoso.onmicrosoft.com',
        mail: 'ada@contoso.com',
        givenName: 'Ada',
        surname: 'Lovelace',
        deletedDateTime: '2026-04-22T10:15:30Z',
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
            $select: DELETED_USER_SELECT,
            $orderby: 'deletedDateTime desc',
            $top: '50',
        };
        if (lastFetchEpochMS !== 0) {
            query['$filter'] = `deletedDateTime gt ${dayjs(lastFetchEpochMS).toISOString()}`;
        }
        // https://learn.microsoft.com/en-us/graph/api/directory-deleteditems-list?view=graph-rest-1.0&tabs=http
        const res = await callGraphApi<{ value?: DeletedGraphUser[] }>(auth.access_token, {
            method: HttpMethod.GET,
            url: '/directory/deletedItems/microsoft.graph.user',
            query,
        });
        return (res.value ?? [])
            .filter((u) => u.deletedDateTime)
            .map((user) => ({
                epochMilliSeconds: dayjs(user.deletedDateTime).valueOf(),
                data: user,
            }));
    },
};

type DeletedGraphUser = {
    id: string;
    deletedDateTime?: string;
    [key: string]: unknown;
};
