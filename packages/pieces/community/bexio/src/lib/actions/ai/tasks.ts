import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bexioAuth } from '../../auth';
import { bexioAi } from '../../common/ai-helpers';
import { bexioOutputSchemas } from '../../common/output-schemas';

export const bexioListTasks = createAction({
  auth: bexioAuth,
  name: 'bexio_list_tasks',
  classification: 'SEARCH',
  displayName: 'List Tasks',
  description: 'List tasks in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists tasks in Bexio; pass order_by=id_desc for newest first. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.taskListOutputSchema,
  props: {
    ...bexioAi.listProps({ orderByHint: 'Sort field with optional _asc/_desc suffix, e.g. id_desc or updated_at_desc.' }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/2.0/task`, limit: propsValue.limit, offset: propsValue.offset, orderBy: propsValue.order_by });
  },
});

export const bexioSearchTasks = createAction({
  auth: bexioAuth,
  name: 'bexio_search_tasks',
  classification: 'SEARCH',
  displayName: 'Search Tasks',
  description: 'Search tasks in Bexio by field criteria.',
  audience: 'ai',
  aiMetadata: { description: 'Finds tasks matching one or two field criteria (operators like, =, >, in, is_null, ...). Use this to resolve an ID by name or number. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.taskListOutputSchema,
  props: {
    ...bexioAi.searchProps({ fieldsHint: 'subject, updated_at, user_id, contact_id, todo_status_id, module_id, entry_id' }),
    ...bexioAi.listProps({ orderByHint: 'Sort field with optional _asc/_desc suffix, e.g. id_desc or updated_at_desc.' }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.search({ auth, path: `/2.0/task/search`, criteria: bexioAi.searchCriteria({ values: propsValue }), limit: propsValue.limit, offset: propsValue.offset, orderBy: propsValue.order_by });
  },
});

export const bexioGetTask = createAction({
  auth: bexioAuth,
  name: 'bexio_get_task',
  classification: 'READ',
  displayName: 'Get Task',
  description: 'Get a single task by ID.',
  audience: 'ai',
  aiMetadata: { description: 'Fetches one task by its numeric ID with all fields. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.taskOutputSchema,
  props: {
    task_id: bexioAi.idProp({ displayName: 'Task ID', description: 'Numeric task ID. Find it with bexio_search_tasks or bexio_list_tasks.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.GET, path: `/2.0/task/${bexioAi.pathId({ value: propsValue.task_id, label: 'Task ID' })}` });
  },
});
