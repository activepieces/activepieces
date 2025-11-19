import { meistertaskAuth } from '../../index';
import {  makeRequest, meisterTaskCommon } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

export const createTask = createAction({
  auth: meistertaskAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Creates a new task',
  props: {
    project: meisterTaskCommon.project,
    section: meisterTaskCommon.section,
    name: Property.ShortText({
      displayName: 'Task Name',
      required: true,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      required: false,
    }),
    assigned_to: meisterTaskCommon.person,
    due_date: Property.DateTime({
      displayName: 'Due Date',
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { section, name, notes, assigned_to, due_date } = context.propsValue;

    const body: any = {
      name,
      section_id: section,
    };

    if (notes) body.notes = notes;
    if (assigned_to) body.assigned_to_id = assigned_to;
    if (due_date) body.due = due_date;

    const response = await makeRequest(
      HttpMethod.POST,
      '/tasks',
      token,
      body
    );

    return response.body;
  },
});