import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { microsoftToDoAuth } from '../../index';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { TodoTaskList } from '@microsoft/microsoft-graph-types';

const fetchAllTaskLists = async (client: Client): Promise<TodoTaskList[]> => {
  const lists: TodoTaskList[] = [];
  let response: PageCollection = await client.api('/me/todo/lists').get();

  while (response.value.length > 0) {
    lists.push(...(response.value as TodoTaskList[]));
    if (response['@odata.nextLink']) {
      response = await client.api(response['@odata.nextLink']).get();
    } else {
      break;
    }
  }
  return lists;
};

export const newListCreatedTrigger = createTrigger({
  auth: microsoftToDoAuth,
  name: 'new_list_created',
  displayName: 'New Task List',
  description: 'Triggers when a new task list is created.',
  props: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });
    const initialLists = await fetchAllTaskLists(client);
    const listIds = initialLists.map((list) => list.id);
    await context.store.put('task_list_ids', listIds);
  },

  async onDisable(context) {
    await context.store.put('task_list_ids', []);
  },

  async run(context) {
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });
    const oldListIds =
      (await context.store.get<string[]>('task_list_ids')) ?? [];
    const oldListIdsSet = new Set(oldListIds);
    const currentLists = await fetchAllTaskLists(client);
    const newLists = currentLists.filter(
      (list) => list.id && !oldListIdsSet.has(list.id)
    );
    if (newLists.length > 0) {
      const currentListIds = currentLists.map((list) => list.id);
      await context.store.put('task_list_ids', currentListIds);
    }
    return newLists;
  },

  async test(context) {
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });
    const lists = await fetchAllTaskLists(client);
    return lists.slice(-5);
  },

  sampleData: {
    '@odata.etag': 'W/"m19f4609-a798-48f5-9333-a3a1ce30d9e8A="',
    displayName: 'New Project Plan',
    isOwner: true,
    isShared: false,
    wellknownListName: 'none',
    id: 'AQMkADMwNTcyYjI0LWE4YjYtNDYwNS1iYTM5LTgxOTkyMDRjMWE1ZgAuAAADs_w3_j',
  },
});
