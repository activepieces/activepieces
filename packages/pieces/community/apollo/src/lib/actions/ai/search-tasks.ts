import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf, recordsOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiSearchTasksAction = createAction({
  auth: apolloAuth,
  name: 'ai_search_tasks',
  classification: 'SEARCH',
  displayName: 'Search Tasks',
  description: 'List the tasks in your Apollo workspace.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists your team\'s Apollo tasks page by page, sorted by due date (latest first) or priority, with type, status, due date, assignee and the linked contact, account and deal IDs. Apollo offers no text filter here. Uses no credits.',
    idempotent: true,
  },
  props: {
    sort_by: aiProps.choice({
      displayName: 'Sort By',
      description: 'task_due_at (latest due first) or task_priority (highest first).',
      required: false,
      options: [
        { label: 'Due date', value: 'task_due_at' },
        { label: 'Priority', value: 'task_priority' },
      ],
    }),
    page: aiProps.page(),
    per_page: aiProps.perPage({ max: 100, fallback: 25 }),
  },
  outputSchema: apolloOutputSchemas.taskSearch,
  async run({ propsValue, auth }) {
    const { page, perPage } = apolloInputs.pageParams({ page: propsValue.page, perPage: propsValue.per_page, maxPerPage: 100, defaultPerPage: 25 });
    const body = await apolloRequests.searchTasks({ apiKey: apiKeyOf(auth), query: { sort_by_field: apolloInputs.optionalText(propsValue.sort_by), page, per_page: perPage } });
    const tasks = recordsOf(body['tasks']).map((task) => apolloMappers.task(task));
    return { ...apolloMappers.pageInfo({ body, page, perPage, returned: tasks.length }), tasks };
  },
});
