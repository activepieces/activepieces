import { TriggerStrategy, createTrigger, AppConnectionValueForAuthProperty, isNil } from '@activepieces/pieces-framework';
import { microsoftToDoAuth } from '../auth';
import { TodoTaskList } from '@microsoft/microsoft-graph-types';
import { createTodoClient } from '../common';
import { todoApi } from '../common/todo-api';
import { taskListOutputSchema } from '../output-schemas';

const SEEN_LIST_IDS_KEY = 'seenListIds';

export const newListCreatedTrigger = createTrigger({
    auth: microsoftToDoAuth,
    name: 'new_list_created',
    outputSchema: taskListOutputSchema,
    classification: 'READ',
    displayName: 'New List',
    description: 'Triggers when a new task list is created.',
    aiMetadata: {
        description: 'Fires when a new task list is created in the authenticated user\'s Microsoft To Do account. Each event represents one newly added task list; watches all of the user\'s lists rather than a single one.',
    },
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
        if (context.isRepublish && !isNil(await context.store.get<string[]>(SEEN_LIST_IDS_KEY))) {
            return;
        }
        const lists = await fetchAllLists(context.auth);
        await context.store.put<string[]>(SEEN_LIST_IDS_KEY, listIds(lists));
    },

    async onDisable(context) {
        await context.store.delete(SEEN_LIST_IDS_KEY);
    },

    async run(context) {
        const lists = await fetchAllLists(context.auth);
        const seenIds = await context.store.get<string[]>(SEEN_LIST_IDS_KEY);
        await context.store.put<string[]>(SEEN_LIST_IDS_KEY, listIds(lists));
        if (isNil(seenIds)) {
            return [];
        }
        return lists.filter((list) => !seenIds.includes(list.id!));
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

async function fetchAllLists(auth: AppConnectionValueForAuthProperty<typeof microsoftToDoAuth>): Promise<TodoTaskList[]> {
    return todoApi.listAll<TodoTaskList>({ client: createTodoClient(auth), path: '/me/todo/lists' });
}

function listIds(lists: TodoTaskList[]): string[] {
    return lists.map((list) => list.id!);
}
