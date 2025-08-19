import { createAction } from '@activepieces/pieces-framework';
import { motionAuth } from '../../index';
import { BASE_URL, taskId, workspaceId } from '../common/props';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const moveTask = createAction({
  auth: motionAuth,
  name: 'moveTask',
  displayName: 'Move Task',
  description: 'Moves a task to a different workspace.',
  props: {
    workspaceId:workspaceId('Current Workspace'),
    taskId:taskId,
    newWorkspaceId: workspaceId('Target Workspace')
  },
  async run({ auth, propsValue }) {
    const { taskId, newWorkspaceId } = propsValue;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url:`${BASE_URL}/tasks/${taskId}/move`,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': auth,
      },
      body: {
        workspaceId:newWorkspaceId
      }
    });

    return response.body;
  },
});
