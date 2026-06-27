import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistAuth } from '../..';
import { todoistRestClient } from '../common/client/rest-client';

export const todoistListCompletedTasksByDueDateAction = createAction({
  auth: todoistAuth,
  name: 'todoist_list_completed_tasks_by_due_date',
  displayName: 'List Completed Tasks (by Due Date)',
  description: 'List completed tasks whose due date falls in a window.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists completed tasks whose original DUE date falls between since and until. Use this for "what was scheduled for this period and got done" reports; use List Completed Tasks (by Completion Date) instead to key on when each task was actually finished. The window is bounded (roughly 6 weeks max). Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    since: Property.ShortText({
      displayName: 'Since',
      description: 'Start of the due-date window, date "YYYY-MM-DD" or RFC3339 datetime (e.g. "2026-06-01").',
      required: true,
    }),
    until: Property.ShortText({
      displayName: 'Until',
      description: 'End of the due-date window, date "YYYY-MM-DD" or RFC3339 datetime (e.g. "2026-06-27"). Must be within the allowed window of Since.',
      required: true,
    }),
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description: 'Optional. Limit results to this project (16-character base32 ID from List Projects).',
      required: false,
    }),
    section_id: Property.ShortText({
      displayName: 'Section ID',
      description: 'Optional. Limit results to this section (16-character base32 ID from List Sections).',
      required: false,
    }),
    parent_id: Property.ShortText({
      displayName: 'Parent Task ID',
      description: 'Optional. Limit results to sub-tasks of this parent task.',
      required: false,
    }),
    filter_query: Property.ShortText({
      displayName: 'Filter Query',
      description: 'Optional Todoist filter query to further narrow the results (same syntax as Filter Tasks).',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum tasks per page (default 200). All pages are followed automatically.',
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { since, until, project_id, section_id, parent_id, filter_query, limit } =
      context.propsValue;

    assertNotNullOrUndefined(token, 'token');

    const tasks = await todoistRestClient.tasks.listCompletedByDueDate({
      token,
      since,
      until,
      project_id,
      section_id,
      parent_id,
      filter_query,
      limit,
    });

    return { tasks, count: tasks.length };
  },
});
