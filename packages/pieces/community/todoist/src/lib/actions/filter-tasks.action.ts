import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistAuth } from '../..';
import { todoistRestClient } from '../common/client/rest-client';

export const todoistFilterTasksAction = createAction({
  auth: todoistAuth,
  name: 'todoist_filter_tasks',
  displayName: 'Filter Tasks',
  description: 'Query active tasks using Todoist filter syntax.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns active tasks matching a Todoist filter query (e.g. "today | overdue", "p1 & !#Work", "search: meeting", "no due date"). Use this to find tasks by date, priority, label, or project rather than by exact name; for a single task whose exact title you already know use Find Task instead. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description:
        'Todoist filter query. Examples: "today | overdue", "p1 & !#Work", "search: meeting", "no due date". Uses Todoist\'s native filter syntax.',
      required: true,
    }),
    lang: Property.ShortText({
      displayName: 'Language',
      description:
        'IETF language code for parsing date keywords in the query (e.g. "en", "de"). Defaults to the account language.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of tasks to return per page (1-200, default 50). All matching pages are followed automatically.',
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { query, lang, limit } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');

    const tasks = await todoistRestClient.tasks.filter({
      token,
      query,
      lang,
      limit,
    });

    return { tasks, count: tasks.length };
  },
});
