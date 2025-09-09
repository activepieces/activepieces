import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';
import { copperRequest } from '../common/http';

export const createTask = createAction({
  auth: copperAuth,
  name: 'copper_create_task',
  displayName: 'Create Task',
  description: 'Adds a new task in Copper.',
  props: {
    name: Property.ShortText({ displayName: 'Task Name', required: true }),
    details: Property.LongText({ displayName: 'Details', required: false }),
    due_date: Property.DateTime({ displayName: 'Due Date', required: false }),
    assignee_id: Property.Number({ displayName: 'Assignee ID', required: false }),
    related_resource: Property.Object({
      displayName: 'Related Resource',
      required: false,
      description: 'Resource this task is related to (person, company, opportunity, etc.)',
    }),
    priority: Property.Dropdown({
      displayName: 'Priority',
      required: false,
      options: async () => ({
        options: [
          { label: 'None', value: 'None' },
          { label: 'Low', value: 'Low' },
          { label: 'Medium', value: 'Medium' },
          { label: 'High', value: 'High' },
        ],
      }),
    }),
    status: Property.Dropdown({
      displayName: 'Status',
      required: false,
      options: async () => ({
        options: [
          { label: 'Open', value: 'Open' },
          { label: 'Completed', value: 'Completed' },
        ],
      }),
    }),
  },
  async run(ctx) {
    const body: Record<string, unknown> = {
      name: ctx.propsValue.name,
      details: ctx.propsValue.details,
      due_date: ctx.propsValue.due_date,
      assignee_id: ctx.propsValue.assignee_id,
      related_resource: ctx.propsValue.related_resource,
      priority: ctx.propsValue.priority,
      status: ctx.propsValue.status,
    };

    return await copperRequest({
      auth: ctx.auth,
      method: HttpMethod.POST,
      url: `/tasks`,
      body,
    });
  },
});
