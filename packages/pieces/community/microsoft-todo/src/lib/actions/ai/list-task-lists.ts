import { createAction, Property } from '@activepieces/pieces-framework';
import { TodoTaskList } from '@microsoft/microsoft-graph-types';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { MATCH_TYPE_OPTIONS, todoApi } from '../../common/todo-api';
import { todoProps } from '../../common/todo-props';
import { microsoftTodoListTaskListsOutputSchema } from '../../output-schemas';

export const microsoftTodoListTaskListsAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_list_task_lists',
  outputSchema: microsoftTodoListTaskListsOutputSchema,
  displayName: 'List Task Lists',
  description: 'List the task lists of the connected account, optionally filtered by name.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'List the connected user\'s Microsoft To Do task lists with their IDs, optionally filtered by name (contains, starts with or exact match). Use it to resolve a list ID from a name before working with tasks; the built-in "Tasks" list has wellknownListName "defaultList". Returns one page; pass nextPageToken back as Page Token for more.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Only return lists whose name matches this text.',
      required: false,
    }),
    match_type: Property.StaticDropdown({
      displayName: 'Match Type',
      description: 'How Name is matched. Defaults to Contains.',
      required: false,
      options: { options: MATCH_TYPE_OPTIONS },
    }),
    limit: todoProps.limit(),
    page_token: todoProps.pageToken(),
  },
  async run(context) {
    const { name, match_type, limit, page_token } = context.propsValue;
    const trimmedName = name?.trim();
    const page = await todoApi.listPage<TodoTaskList>({
      client: createTodoClient(context.auth),
      path: '/me/todo/lists',
      top: limit,
      pageToken: page_token,
      filter: trimmedName
        ? todoApi.matchFilter({ field: 'displayName', value: trimmedName, matchType: match_type })
        : undefined,
    });
    const lists = page.items.map(todoApi.toTaskList);
    return { lists, count: lists.length, nextPageToken: page.nextPageToken };
  },
});
