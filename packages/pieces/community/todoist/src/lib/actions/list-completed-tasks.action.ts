import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistAuth } from '../..';
import { todoistRestClient } from '../common/client/rest-client';

export const todoistListCompletedTasksAction = createAction({
  auth: todoistAuth,
  name: 'todoist_list_completed_tasks',
  displayName: 'List Completed Tasks (by Completion Date)',
  description: 'List tasks completed within a date window.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists tasks that were completed (checked off) between the since and until timestamps. Use this for "what got done in this period" reports keyed on when work was finished; use List Completed Tasks by Due Date instead to key on when tasks were originally due. The window is bounded (roughly 3 months max). Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    since: Property.ShortText({
      displayName: 'Since',
      description: 'Start of the window, RFC3339 datetime (e.g. "2026-06-01T00:00:00Z"). Tasks completed at or after this time are included.',
      required: true,
    }),
    until: Property.ShortText({
      displayName: 'Until',
      description: 'End of the window, RFC3339 datetime (e.g. "2026-06-27T23:59:59Z"). Must be within ~3 months of Since.',
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

    const tasks = await todoistRestClient.tasks.listCompletedByCompletionDate({
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
