import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieRequest } from '../common/client';
import { moxieInput } from '../common/props';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieSearchTasksAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_search_tasks',
  classification: 'SEARCH',
  displayName: 'Search Tasks',
  description: 'Find tasks by name or description, or look one up by id.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches Moxie tasks whose name or description contains the query (case-insensitive), or returns the one task with an exact Task ID. Use to find a task id before updating or approving it; use List Tasks to filter by project, client or stage instead. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: moxieActionOutputSchemas.taskList,
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Text to match in the task name or description.',
      required: false,
    }),
    id: Property.ShortText({
      displayName: 'Task ID',
      description: 'Exact task id. When set, the query is ignored.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return moxieRequest<unknown>({
      credentials: credentialsOf({ auth }),
      method: HttpMethod.GET,
      path: '/action/tasks/search',
      query: moxieInput.queryOrId({ query: propsValue.query, id: propsValue.id, idField: 'Task ID' }),
    });
  },
});
