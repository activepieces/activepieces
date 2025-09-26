import { createTrigger, TriggerStrategy, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { microsoftToDoAuth } from '../../index';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import dayjs from 'dayjs';

// https://learn.microsoft.com/en-us/graph/api/todo-list-lists?view=graph-rest-1.0&tabs=http
const polling: Polling<OAuth2PropertyValue, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, lastFetchEpochMS }) => {
        const client = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: () => Promise.resolve(auth.access_token),
            },
        });

        const response: PageCollection = await client.api('/me/todo/lists').get();
        const lists = response.value;

        // If first poll, return the latest 10 lists
        if (lastFetchEpochMS === 0) {
            return lists
                .slice(-10)
                .map((list) => ({
                    epochMilliSeconds: dayjs(list.createdDateTime).valueOf(),
                    data: list,
                }));
        }

        // Otherwise, return lists created since last fetch
        return lists
            .filter((list) => dayjs(list.createdDateTime).valueOf() > lastFetchEpochMS)
            .map((list) => ({
                epochMilliSeconds: dayjs(list.createdDateTime).valueOf(),
                data: list,
            }));
    },
};

export const newListTrigger = createTrigger({
    auth: microsoftToDoAuth,
    name: 'newList',
    displayName: 'New List',
    description: 'Triggers when a new task list is created.',
    props: {},
    sampleData: {
        "@odata.etag": "W/\"etag-value\"",
        displayName: "Sample List",
        isOwner: true,
        isShared: false,
        wellknownListName: "none",
        id: "AAMkAGVmMDEzYjYwLTc2YjItNDI2Zi1hYjYwLTYwYjQ3YjYwYjYwYwAuAAAAAACv...",
        createdDateTime: "2025-09-26T10:00:00.000Z"
    },
    type: TriggerStrategy.POLLING,
    async test(context) {
        return await pollingHelper.test(polling, context);
    },
    async onEnable(context) {
        const { store, auth, propsValue } = context;
        await pollingHelper.onEnable(polling, { store, auth, propsValue });
    },
    async onDisable(context) {
        const { store, auth, propsValue } = context;
        await pollingHelper.onDisable(polling, { store, auth, propsValue });
    },
    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});