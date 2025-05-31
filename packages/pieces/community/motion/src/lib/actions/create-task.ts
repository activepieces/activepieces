import { createAction, Property } from '@activepieces/pieces-framework';
import { motionAuth } from '../../index';
import {
  BASE_URL,
  priority,
  projectId,
  statusId,
  userId,
  workspaceId,
} from '../common/props';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';


export const createTask = createAction({
  auth: motionAuth,
  name: 'create-task',
  displayName: 'Create Task',
  description: 'Creates a new task.',
  props: {
    workspaceId: workspaceId('Workspace ID'),
    name: Property.ShortText({
      displayName: 'Task Name',
      required: true,
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
      description: 'The names of the labels to be added to the task.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/tasks`,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': auth,
      },
      body: {
        name: propsValue.name,
        workspaceId: propsValue.workspaceId,
        description: propsValue.description,
        dueDate: propsValue.dueDate,
        duration: propsValue.duration,
        status: propsValue.statusId,
        priority: propsValue.priority,
        projectId: propsValue.projectId,
        assigneeId: propsValue.assigneeId,
        labels: (propsValue.labels as string[]) || [],
      },
    });

    return response.body;
  },
});
