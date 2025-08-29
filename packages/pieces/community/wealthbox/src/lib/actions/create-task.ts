import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { wealthboxAuth } from '../common/auth';
import { WealthboxClient } from '../common/client';

export const createTask = createAction({
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Creates a new task in Wealthbox CRM',
  auth: wealthboxAuth,
  props: {
    title: Property.ShortText({
      displayName: 'Task Title',
      description: 'The title of the task',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The description of the task',
      required: false,
    }),
    due_date: Property.DateTime({
      displayName: 'Due Date',
      description: 'The due date and time of the task',
      required: false,
    }),
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact to link the task to',
      required: false,
    }),
    assigned_to: Property.ShortText({
      displayName: 'Assigned To',
      description: 'The ID of the user assigned to the task',
      required: false,
    }),
    priority: Property.Dropdown({
      displayName: 'Priority',
      description: 'The priority level of the task',
      required: false,
      refreshers: [],
      options: async () => {
        return {
          options: [
            { label: 'Low', value: 'low' },
            { label: 'Medium', value: 'medium' },
            { label: 'High', value: 'high' },
          ],
        };
      },
      defaultValue: 'medium',
    }),
  },
  async run(context) {
    const client = new WealthboxClient(context.auth as OAuth2PropertyValue);
    
    const taskData: any = {
      title: context.propsValue.title,
    };

    if (context.propsValue.description) {
      taskData.description = context.propsValue.description;
    }

    if (context.propsValue.due_date) {
      taskData.due_date = context.propsValue.due_date;
    }

    if (context.propsValue.contact_id) {
      taskData.contact_id = context.propsValue.contact_id;
    }

    if (context.propsValue.assigned_to) {
      taskData.assigned_to = context.propsValue.assigned_to;
    }

    if (context.propsValue.priority) {
      taskData.priority = context.propsValue.priority;
    }

    const task = await client.createTask(taskData);
    return task;
  },
}); 