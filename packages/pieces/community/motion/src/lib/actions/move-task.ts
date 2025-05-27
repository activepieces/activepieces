import { createAction, Property } from '@activepieces/pieces-framework';
import { motionAuth } from '../../index';

export const moveTask = createAction({
  auth: motionAuth,
  name: 'moveTask',
  displayName: 'Move Task',
  description: 'Move a task to a different workspace',
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task to move',
      required: true,
    }),
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      description: 'The ID of the workspace to move the task to',
      required: true,
    }),
    assigneeId: Property.ShortText({
      displayName: 'Assignee ID',
      description: 'The user ID the task should be assigned to (optional)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { taskId, workspaceId, assigneeId } = propsValue;
    
    const response = await fetch(`https://api.usemotion.com/v1/tasks/${taskId}/move`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': auth,
      },
      body: JSON.stringify({
        workspaceId,
        ...(assigneeId && { assigneeId }),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to move task: ${error.message || response.statusText}`);
    }

    return await response.json();
  },
});
