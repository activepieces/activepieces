import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { googleTasksCommon, Task } from '../common';
import { googleTasksAuth } from '../auth';

export const googleTasksUpdateTaskAction = createAction({
  auth: googleTasksAuth,
  name: 'update_task',
  displayName: 'Update Task',
  description: 'Edit an existing task — title, notes, due date, or status.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Edit an existing task\'s title, notes, due date, or status (e.g. rename, change due date, reopen). Partial update — only provided fields change. Not idempotent (use Mark Task Complete for the common complete case).',
    idempotent: false,
  },
  props: {
    tasks_list: googleTasksCommon.tasksList,
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description:
        'The ID of the task to update. Obtain the id from Find Tasks.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New title for the task.',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'New notes / description for the task.',
      required: false,
    }),
    due: Property.DateTime({
      displayName: 'Due Date',
      description:
        'New due date for the task. RFC 3339 timestamp, e.g. 2026-07-15T00:00:00Z.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description:
        'Task status. To simply complete a task prefer Mark Task Complete; set needsAction here to reopen a completed task.',
      required: false,
      options: {
        options: [
          { label: 'Needs Action', value: 'needsAction' },
          { label: 'Completed', value: 'completed' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const authProp = auth as OAuth2PropertyValue;
    const { tasks_list, task_id, title, notes, due, status } = propsValue;

    const patch: Partial<Task> = {};
    if (title !== undefined && title !== null && title !== '') {
      patch.title = title;
    }
    if (notes !== undefined && notes !== null) {
      patch.notes = notes;
    }
    if (due !== undefined && due !== null) {
      patch.due = `${new Date(due).toISOString().split('T')[0]}T00:00:00Z`;
    }
    if (status !== undefined && status !== null) {
      patch.status = status as Task['status'];
    }

    const response = await httpClient.sendRequest<Task>({
      method: HttpMethod.PATCH,
      url: `${googleTasksCommon.baseUrl}/tasks/v1/lists/${tasks_list}/tasks/${task_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: authProp.access_token,
      },
      body: patch,
    });

    return response.body;
  },
});
