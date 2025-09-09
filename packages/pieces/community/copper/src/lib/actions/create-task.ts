import { createAction, Property } from '@activepieces/pieces-framework';
import { copperAuth } from '../../index';
import { copperRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createTask = createAction({
  auth: copperAuth,
  name: 'copper_create_task',
  displayName: 'Create Task',
  description: 'Create a new task in Copper',
  props: {
    name: Property.ShortText({
      displayName: 'Task Name',
      description: 'Name/title of the task',
      required: true,
    }),
    details: Property.LongText({
      displayName: 'Details',
      description: 'Task description and details',
      required: false,
    }),
    assignee_id: Property.ShortText({
      displayName: 'Assignee ID',
      description: 'ID of the user assigned to the task',
      required: false,
    }),
    due_date: Property.DateTime({
      displayName: 'Due Date',
      description: 'When the task is due',
      required: false,
    }),
    reminder_date: Property.DateTime({
      displayName: 'Reminder Date',
      description: 'When to send a reminder for the task',
      required: false,
    }),
    related_resource: Property.Json({
      displayName: 'Related Resource',
      description: 'Related resource (person, lead, opportunity, etc.) as JSON object with type and id',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'Task priority level',
      required: false,
      options: {
        options: [
          { label: 'None', value: 'None' },
          { label: 'High', value: 'High' },
          { label: 'Medium', value: 'Medium' },
          { label: 'Low', value: 'Low' },
        ],
      },
    }),
  },
  async run(context) {
    const { 
      name, 
      details, 
      assignee_id, 
      due_date, 
      reminder_date, 
      related_resource,
      priority
    } = context.propsValue;

    const body: any = {
      name,
    };

    if (details) body.details = details;
    if (assignee_id) body.assignee_id = assignee_id;
    if (due_date) body.due_date = due_date;
    if (reminder_date) body.reminder_date = reminder_date;
    if (related_resource) body.related_resource = related_resource;
    if (priority) body.priority = priority;

    const response = await copperRequest({
      auth: context.auth,
      method: HttpMethod.POST,
      url: '/tasks',
      body,
    });

    return response;
  },
});
