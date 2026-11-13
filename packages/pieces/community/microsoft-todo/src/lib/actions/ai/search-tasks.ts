import { createAction, Property } from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { TodoTask, TodoTaskList } from '@microsoft/microsoft-graph-types';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { MATCH_TYPE_OPTIONS, TASK_STATUS_OPTIONS, todoApi } from '../../common/todo-api';
import { microsoftTodoSearchTasksOutputSchema } from '../../output-schemas';

export const microsoftTodoSearchTasksAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_search_tasks',
  outputSchema: microsoftTodoSearchTasksOutputSchema,
  displayName: 'Search Tasks in All Lists',
  description: 'Find tasks by title and status across every task list.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Search every Microsoft To Do task list for tasks matching a title (contains, starts with or exact match) and/or status, and return each match with its list ID and list name. Use it when you don\'t know which list a task is in; use List Tasks when you do. Stops as soon as Limit matches are found; truncated is then true unless every list was already searched, so more matches may exist. Read-only.',
    idempotent: true,
  },
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Only return tasks whose title matches this text.',
      required: false,
    }),
    match_type: Property.StaticDropdown({
      displayName: 'Match Type',
      description: 'How Title is matched. Defaults to Contains.',
      required: false,
      options: { options: MATCH_TYPE_OPTIONS },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only return tasks with this status.',
      required: false,
      options: { options: TASK_STATUS_OPTIONS },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of tasks to return (1-200). Defaults to 50.',
      required: false,
    }),
  },
  async run(context) {
    const { title, match_type, status, limit } = context.propsValue;
    const trimmedTitle = title?.trim();
    if (!trimmedTitle && !status) {
      throw new Error('Provide a title, a status, or both to search for.');
    }
    const maxResults = Math.min(Math.max(Math.trunc(limit ?? 50), 1), 200);
    const filter = [
      ...(status ? [`status eq '${status}'`] : []),
      ...(trimmedTitle ? [todoApi.matchFilter({ field: 'title', value: trimmedTitle, matchType: match_type })] : []),
    ].join(' and ');
    const client = createTodoClient(context.auth);
    const lists = await todoApi.listAll<TodoTaskList>({ client, path: '/me/todo/lists' });
    const { tasks, truncated } = await collectMatches({ client, lists, filter, maxResults });
    return { tasks, count: tasks.length, truncated };
  },
});

async function collectMatches({
  client,
  lists,
  filter,
  maxResults,
}: {
  client: Client;
  lists: TodoTaskList[];
  filter: string;
  maxResults: number;
}): Promise<{ tasks: SearchMatch[]; truncated: boolean }> {
  const tasks: SearchMatch[] = [];
  for (const [listIndex, list] of lists.entries()) {
    if (!list.id) {
      continue;
    }
    let page: PageCollection = await client
      .api(`${todoApi.listPath({ listId: list.id })}/tasks`)
      .filter(filter)
      .top(100)
      .get();
    while (true) {
      const pageTasks: TodoTask[] = page.value;
      for (const [taskIndex, task] of pageTasks.entries()) {
        tasks.push({ ...todoApi.toTask(task), listId: list.id, listName: list.displayName ?? null });
        if (tasks.length >= maxResults) {
          const searchedEverything =
            taskIndex === pageTasks.length - 1 && !page['@odata.nextLink'] && listIndex === lists.length - 1;
          return { tasks, truncated: !searchedEverything };
        }
      }
      if (!page['@odata.nextLink']) {
        break;
      }
      page = await client.api(page['@odata.nextLink']).get();
    }
  }
  return { tasks, truncated: false };
}

type SearchMatch = ReturnType<typeof todoApi.toTask> & { listId: string; listName: string | null };
