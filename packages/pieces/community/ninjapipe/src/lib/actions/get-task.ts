import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon } from '../common';

export const getTask = createAction({
  auth: ninjapipeAuth,
  name: 'get_task',
  displayName: 'Get Task',
  description: 'Retrieves a single task within a project.',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single task by its ID within a specific project to read its current details; requires both the project ID and the task ID. Use when you already have both IDs. Read-only and idempotent.', idempotent: true },
  props: {
    projectId: ninjapipeCommon.projectDropdownRequired,
    taskId: ninjapipeCommon.taskDropdown,
  },
  async run(context) {
    const auth = getAuth(context);
    const { projectId, taskId } = context.propsValue;
    const response = await ninjapipeApiCall<Record<string, unknown>>({
      auth,
      method: HttpMethod.GET,
      path: `/projects/${encodeURIComponent(String(projectId))}/tasks/${encodeURIComponent(String(taskId))}`,
    });
    return flattenCustomFields(response.body);
  },
});
