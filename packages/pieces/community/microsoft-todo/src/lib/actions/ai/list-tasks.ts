import { createAction, Property } from '@activepieces/pieces-framework';
import { TodoTask } from '@microsoft/microsoft-graph-types';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { MATCH_TYPE_OPTIONS, TASK_STATUS_OPTIONS, todoApi } from '../../common/todo-api';
import { todoProps } from '../../common/todo-props';
import { microsoftTodoListTasksOutputSchema } from '../../output-schemas';

export const microsoftTodoListTasksAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_list_tasks',
  outputSchema: microsoftTodoListTasksOutputSchema,
  displayName: 'List Tasks',
  description: 'List the tasks in a task list, optionally filtered by title and status.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'List the tasks in one Microsoft To Do task list (ID from List Task Lists), optionally filtered by title (contains, starts with or exact match) and status. Use it to find a task ID by title before reading, updating, completing or deleting the task. Checklist items, linked resources and attachments are not included; use their own list actions. Returns one page; pass nextPageToken back as Page Token for more.',
    idempotent: true,
  },
  props: {
    list_id: todoProps.listId(),
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
    limit: todoProps.limit(),
    page_token: todoProps.pageToken(),
  },
  async run(context) {
    const { list_id, title, match_type, status, limit, page_token } = context.propsValue;
    const trimmedTitle = title?.trim();
    const filters = [
      ...(status ? [`status eq '${status}'`] : []),
      ...(trimmedTitle ? [todoApi.matchFilter({ field: 'title', value: trimmedTitle, matchType: match_type })] : []),
    ];
    const page = await todoApi.listPage<TodoTask>({
      client: createTodoClient(context.auth),
      path: `${todoApi.listPath({ listId: list_id })}/tasks`,
      top: limit,
      pageToken: page_token,
      filter: filters.length > 0 ? filters.join(' and ') : undefined,
    });
    const tasks = page.items.map(todoApi.toTask);
    return { tasks, count: tasks.length, nextPageToken: page.nextPageToken };
  },
});
