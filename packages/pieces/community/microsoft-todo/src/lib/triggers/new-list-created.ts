import { TriggerStrategy, createTrigger, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { microsoftToDoAuth } from '../auth';
import { TodoTaskList } from '@microsoft/microsoft-graph-types';
import { createTodoClient } from '../common';

const polling: Polling<AppConnectionValueForAuthProperty<typeof microsoftToDoAuth>, Record<string, never>> = {
    strategy: DedupeStrategy.LAST_ITEM,
    items: async ({ auth }) => {
        const client = createTodoClient(auth);

        const response = await client.api('/me/todo/lists').get();
        const lists = response.value as TodoTaskList[];

        return lists.map((list) => ({
            id: list.id!,
            data: list,
        }));
    },
};

export const newListCreatedTrigger = createTrigger({
    auth: microsoftToDoAuth,
    name: 'new_list_created',
    displayName: 'New List',
    description: 'Triggers when a new task list is created.',
    props: {},
    type: TriggerStrategy.POLLING,
    sampleData: {
        '@odata.etag': 'W/"m19slk90924jJPD1941jla="',
        'displayName': 'Vacation Plans',
        'isOwner': true,
        'isShared': false,
        'wellknownListName': 'none',
        'id': 'AAMkAGI2NGY3NTY0LTZmYjEtNDk0MS04YjQ5LTFlNmQ5NjI1MWI5ZgAuAAAAAAC50Fk_sKMfS5_62i1Isws2AQD3xL9-24sxT5RO4265g_AEAAB3x24kAAA=',
    },

    async onEnable(context) {
        await pollingHelper.poll(polling, context as any);
    },

    async onDisable(context) {
        await pollingHelper.onDisable(polling, context as any);
        },

    async run(context) {
        return await pollingHelper.poll(polling, context as any);
    },

    async test(context) {
        try {
            const client = createTodoClient(context.auth);

            const response = await client.api('/me/todo/lists').get();
            const lists = (response.value as TodoTaskList[]).slice(0, 5);
            return lists;
        } catch (error: any) {
            throw new Error(`Failed to fetch task lists: ${error?.message || error}`);
        }
    },
});