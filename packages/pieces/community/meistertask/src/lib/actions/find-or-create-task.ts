import { meistertaskAuth } from '../../index';
import { makeRequest, meisterTaskCommon } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

export const findOrCreateTask = createAction({
  auth: meistertaskAuth,
  name: 'find_or_create_task',
  displayName: 'Find or Create Task',
  description: 'Finds a task by searching, or creates one if it doesn\'t exist',
  props: {
    project: meisterTaskCommon.project,
    section: meisterTaskCommon.section,
    name: Property.ShortText({
      displayName: 'Task Name',
      required: true,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Notes for the task (used if creating)',
      required: false,
    }),
    assigned_to: meisterTaskCommon.person,
    due_date: Property.DateTime({
      displayName: 'Due Date',
      description: 'Due date for the task (used if creating)',
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { section, name, notes, assigned_to, due_date } = context.propsValue;

    // Try to find existing task
    const findResponse = await makeRequest(
      HttpMethod.GET,
      `/sections/${section}/tasks`,
      token
    );

    const existingTask = findResponse.body.find((task: any) =>
      task.name.toLowerCase() === name.toLowerCase()
    );

    if (existingTask) {
      return {
        found: true,
        created: false,
        task: existingTask,
      };
    }

    // Create new task
    const body: any = {
      name,
      section_id: section,
    };

    if (notes) body.notes = notes;
    if (assigned_to) body.assigned_to_id = assigned_to;
    if (due_date) body.due = due_date;

    const createResponse = await makeRequest(
      HttpMethod.POST,
      '/tasks',
      token,
      body
    );

    return {
      found: false,
      created: true,
      task: createResponse.body,
    };
  },
});