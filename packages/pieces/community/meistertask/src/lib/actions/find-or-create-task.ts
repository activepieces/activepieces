import { meistertaskAuth, getAccessToken } from '../auth';
import { makeRequest, meisterTaskCommon } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

export const findOrCreateTask = createAction({
  auth: meistertaskAuth,
  name: 'find_or_create_task',
  displayName: 'Find or Create Task',
  description: 'Finds a task by searching, or creates one if it doesn\'t exist',
  audience: 'both',
  aiMetadata: { description: 'Ensure a task with a given name exists in a MeisterTask section: returns the existing task if one matches the name exactly (case-insensitive), otherwise creates it with the supplied notes, assignee, and due date. Use to add a task without duplicating it. Idempotent on the name — repeat calls return the existing task rather than creating another. Requires the project, section, and task name.', idempotent: true },
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
    const token = getAccessToken(context.auth);
    const { section, name, notes, assigned_to, due_date } = context.propsValue;

    const findResponse = await makeRequest(
      HttpMethod.GET,
      `/sections/${section}/tasks`,
      token
    );

    const tasks = Array.isArray(findResponse.body) ? findResponse.body : [];
    const existingTask = tasks.find((task: any) =>
      task.name && task.name.toLowerCase() === name.toLowerCase()
    );

    if (existingTask) {
      return {
        found: true,
        created: false,
        task: existingTask,
      };
    }

    const body: { name: string; section_id: string; notes?: string; assigned_to_id?: string; due?: string } = {
      name,
      section_id: section as string,
    };

    if (notes) body.notes = notes;
    if (assigned_to) body.assigned_to_id = assigned_to as string;
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
