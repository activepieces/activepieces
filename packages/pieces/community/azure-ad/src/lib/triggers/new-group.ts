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

const GROUP_SELECT =
    'id,displayName,description,mail,mailNickname,visibility,groupTypes,securityEnabled,mailEnabled,createdDateTime';

export const newGroupTrigger = createTrigger({
    auth: azureAdAuth,
    name: 'new_group',
    displayName: 'New Group',
    description: 'Triggers when a new group is created in Microsoft Entra ID.',
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
            $select: GROUP_SELECT,
            $orderby: 'createdDateTime desc',
            $top: '50',
        };
        if (lastFetchEpochMS !== 0) {
            query['$filter'] = `createdDateTime gt ${dayjs(lastFetchEpochMS).toISOString()}`;
        }
        // https://learn.microsoft.com/en-us/graph/api/group-list?view=graph-rest-1.0&tabs=http
        const res = await callGraphApi<{ value?: GraphGroup[] }>(auth.access_token, {
            method: HttpMethod.GET,
            url: '/groups',
            query,
        });
        return (res.value ?? [])
            .filter((g) => g.createdDateTime)
            .map((group) => ({
                epochMilliSeconds: dayjs(group.createdDateTime).valueOf(),
                data: group,
            }));
    },
};

type GraphGroup = {
    id: string;
    createdDateTime?: string;
    [key: string]: unknown;
};
