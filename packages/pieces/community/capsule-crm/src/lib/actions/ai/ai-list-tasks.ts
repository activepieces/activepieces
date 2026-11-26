import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../../common/auth';
import { capsuleCrmClient } from '../../common/client';
import { taskPageOutputSchema } from '../../common/output-schemas';

export const aiListTasks = createAction({
  auth: capsuleCrmAuth,
  name: 'ai_list_tasks',
  classification: 'READ',
  displayName: 'List Tasks',
  description: 'Lists tasks.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists Capsule CRM tasks visible to the connected user, one page at a time, filtered by status (open by default). Use the returned id as Task ID in Complete Task. Read-only.',
    idempotent: true,
  },
  outputSchema: taskPageOutputSchema,
  props: {
    status: Property.StaticDropdown({ displayName: 'Status', description: 'Which tasks to return.', required: false, defaultValue: 'open', options: { options: [ { label: 'Open', value: 'open' }, { label: 'Completed', value: 'completed' }, { label: 'Pending', value: 'pending' }, { label: 'All', value: 'open,completed,pending' } ] } }),
    page: Property.Number({ displayName: 'Page', description: 'Page number, starting at 1. Defaults to 1.', required: false }),
    per_page: Property.Number({ displayName: 'Per Page', description: 'Results per page, 1-100. Defaults to 50.', required: false }),
  },
  async run({ auth, propsValue }) {
    const paging = capsuleCrmClient.pageArgs({ page: propsValue.page, perPage: propsValue.per_page });
    const result = await capsuleCrmClient.listTasksPage({ auth, status: propsValue.status ?? 'open', ...paging });
    return { tasks: result.items, page: paging.page, hasMore: result.hasMore };
  },
});
