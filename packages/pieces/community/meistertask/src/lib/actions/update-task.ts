import { meistertaskAuth } from '../../index';
import { meisterTaskCommon, makeRequest } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { Project } from '@activepieces/shared';

export const updateTask = createAction({
  auth: meistertaskAuth,
  name: 'update_task',
  displayName: 'Update Task',
  description: 'Updates an existing task',
  props: {
    Project: meisterTaskCommon.project,
    task_id: meisterTaskCommon.task_id,
    name: Property.ShortText({
      displayName: 'Task Name',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Open', value: 1 },
          { label: 'Completed', value: 2 },
          { label: 'Trashed', value: 18 },
        ],
      },
    }),
    assigned_to: meisterTaskCommon.person,
    due_date: Property.DateTime({
      displayName: 'Due Date',
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { task_id, name, notes, status, assigned_to, due_date } = context.propsValue;

    const body: any = {};
    if (name) body.name = name;
    if (notes) body.notes = notes;
    if (status) body.status = status;
    if (assigned_to) body.assigned_to_id = assigned_to;
    if (due_date) body.due = due_date;

    const response = await makeRequest(
      HttpMethod.PUT,
      `/tasks/${task_id}`,
      token,
      body
    );

    return response.body;
  },
});