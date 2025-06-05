import { createAction, Property } from '@activepieces/pieces-framework';
import { motionAuth } from '../../index';
import {
  BASE_URL,
  priority,
  projectId,
  statusId,
  taskId,
  userId,
  workspaceId,
} from '../common/props';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const updateTask = createAction({
  auth: motionAuth,
  name: 'update-task',
  displayName: 'Update Task',
  description: 'Update an existing task in Motion',
  props: {
    workspaceId: workspaceId('Workspace ID'),
    taskId: taskId,
    name: Property.ShortText({
      displayName: 'Task Name',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      required: false,
    }),
    duration: Property.Number({
      displayName: 'Duration',
      description: 'Duration in minutes.',
      required: false,
    }),
    statusId: statusId,
    priority: priority,
    projectId: projectId,
    assigneeId: userId,
    labels: Property.Array({
      displayName: 'Labels',
      description: 'The names of the labels to be added to the task',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      name,
      workspaceId,
      description,
      dueDate,
      duration,
      statusId,
      priority,
      assigneeId,
    } = propsValue;
    const labels = propsValue.labels ?? [];
    const response = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url: `${BASE_URL}/tasks/${propsValue.taskId}`,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': auth,
      },
      body: {
        name,
        workspaceId,
        description,
        priority,
        dueDate,
        duration,
        staus: statusId,
        assigneeId,
        labels: labels.length > 0 ? labels : undefined,
      },
    });

    return response.body;
  },
});
