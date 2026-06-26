import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { googleTasksCommon, Task } from '../common';
import { googleTasksAuth } from '../auth';

export const googleTasksMoveTaskAction = createAction({
  auth: googleTasksAuth,
  name: 'move_task',
  displayName: 'Move Task',
  description:
    'Reposition or reparent a task within its list, or move it to another list.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Move a task to a new position within its list — reparent it under another task (parent_task_id) and/or place it after a sibling (previous_task_id); omit both to move it to the top level. Optionally move it to a different list (destination_tasklist_id). All ids come from Find Tasks, and parent/previous must reference tasks in the destination list. Use this for reordering/nesting; use Update Task to change a task\'s fields. Not idempotent — position depends on current order.',
    idempotent: false,
  },
  props: {
    tasks_list: googleTasksCommon.tasksList,
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task to move. Obtain the id from Find Tasks.',
      required: true,
    }),
    parent_task_id: Property.ShortText({
      displayName: 'Parent Task ID',
      description:
        'Reparent the task under the task with this id (must be in the destination list). Obtain the id from Find Tasks. Omit to move it to the top level.',
      required: false,
    }),
    previous_task_id: Property.ShortText({
      displayName: 'Previous Task ID',
      description:
        'Place the task immediately after the sibling with this id (must be in the destination list). Obtain the id from Find Tasks. Omit to place it first among its siblings; to move it to the end, pass the last sibling\'s id (read the current order with Find Tasks).',
      required: false,
    }),
    destination_tasklist_id: Property.ShortText({
      displayName: 'Destination Task List ID',
      description:
        'Move the task to this task list. Omit to keep it in the current list. Recurring tasks cannot be moved between lists.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const authProp = auth as OAuth2PropertyValue;
    const {
      tasks_list,
      task_id,
      parent_task_id,
      previous_task_id,
      destination_tasklist_id,
    } = propsValue;

    // parent / previous / destinationTasklist are all QUERY params on tasks.move.
    const queryParams: Record<string, string> = {};
    if (parent_task_id) {
      queryParams['parent'] = parent_task_id;
    }
    if (previous_task_id) {
      queryParams['previous'] = previous_task_id;
    }
    if (destination_tasklist_id) {
      queryParams['destinationTasklist'] = destination_tasklist_id;
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${googleTasksCommon.baseUrl}/tasks/v1/lists/${tasks_list}/tasks/${task_id}/move`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: authProp.access_token,
      },
      queryParams,
    };

    const response = await httpClient.sendRequest<Task>(request);

    return response.body;
  },
});
