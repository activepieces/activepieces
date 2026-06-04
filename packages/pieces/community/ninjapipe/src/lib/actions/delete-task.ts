import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, getAuth, ninjapipeCommon } from '../common';

export const deleteTask = createAction({
  auth: ninjapipeAuth,
  name: 'delete_task',
  displayName: 'Delete Task',
  description: 'Deletes a task within a project. Subtasks may cascade.',
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
