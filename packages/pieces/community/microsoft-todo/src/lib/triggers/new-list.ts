import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { microsoftToDoAuth } from '../../index';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import dayjs from 'dayjs';
import { TodoTaskList } from '@microsoft/microsoft-graph-types';

const polling: Polling<OAuth2PropertyValue, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    async items({ auth, lastFetchEpochMS }) {
        const client = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: () => Promise.resolve(auth.access_token),
            },
        });

        const lists: TodoTaskList[] = [] as unknown as TodoTaskList[];

        const filter =
            lastFetchEpochMS === 0
                ? '$top=10'
                : `$filter=createdDateTime gt ${dayjs(lastFetchEpochMS).toISOString()}`;

        let response: PageCollection = await client.api(`/me/todo/lists?${filter}`).get();

        if (lastFetchEpochMS === 0) {
            for (const list of response.value as TodoTaskList[]) {
                lists.push(list);
            }
        } else {
            while (response.value.length > 0) {
                for (const list of response.value as TodoTaskList[]) {
                    lists.push(list);
                }

                if (response['@odata.nextLink']) {
                    response = await client.api(response['@odata.nextLink']).get();
                } else {
                    break;
                }
            }
        }

        return lists.map((list) => ({
            epochMilliSeconds: dayjs((list as any).createdDateTime ?? list['@microsoft.graph.createdDateTime']).valueOf(),
            data: list,
        }));
    },
};

export const newListTrigger = createTrigger({
    name: 'new_list',
    displayName: 'New List',
    description: 'Triggers when a new task list is created.',
    auth: microsoftToDoAuth,
    props: {},
    type: TriggerStrategy.POLLING,
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
    sampleData: {
        '@odata.etag': 'W/"CQAAABYAAAAmzjv8pWQ4TYGzqk1TGJ3HAAABvH9B"',
        displayName: 'Tasks',
        isOwner: true,
        isShared: false,
        wellknownListName: 'none',
        id: 'AQMkADAwATkyZmYAZS1mMzE2LTZkZmYtMDABLTUwMAoARgAAAa8kzJ7Z8k2gQKZgqfXJHdUBAHIY0m7qD0e8os1lG3S6AAAAgEGAAAA',
    },
});


