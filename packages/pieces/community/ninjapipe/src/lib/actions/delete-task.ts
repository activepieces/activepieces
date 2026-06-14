import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, getAuth, ninjapipeCommon } from '../common';

export const deleteTask = createAction({
  auth: ninjapipeAuth,
  name: 'delete_task',
  displayName: 'Delete Task',
  description: 'Deletes a task within a project. Subtasks may cascade.',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete a task by ID within a given project; any subtasks may be cascade-deleted along with it. Requires both the project ID and the task ID. Use only when the task should be removed outright; the operation is irreversible and safe to retry since re-deleting settles to the same removed state.', idempotent: true },
  props: {
    projectId: ninjapipeCommon.projectDropdownRequired,
    taskId: ninjapipeCommon.taskDropdown,
  },
  async run(context) {
    const auth = getAuth(context);
    const { projectId, taskId } = context.propsValue;
    await ninjapipeApiCall<Record<string, unknown>>({
      auth,
      method: HttpMethod.DELETE,
      path: `/projects/${encodeURIComponent(String(projectId))}/tasks/${encodeURIComponent(String(taskId))}`,
    });
    return { success: true, deleted_id: taskId, project_id: projectId };
  },
});
