import { createAction, Property } from '@activepieces/pieces-framework';
import { makeZendeskSellRequest, Task } from '../common/common';
import { zendeskSellAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';

export const createTaskAction = createAction({
  auth: zendeskSellAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Creates a task',
  props: {
    content: Property.LongText({
      displayName: 'Task Content',
      description: 'Description of the task',
      required: true,
    }),
    dueDate: Property.ShortText({
      displayName: 'Due Date',
      description: 'Due date for the task (YYYY-MM-DD)',
      required: false,
    }),
    remindAt: Property.ShortText({
      displayName: 'Remind At',
      description: 'When to send reminder (ISO 8601 format)',
      required: false,
    }),
    resourceType: Property.StaticDropdown({
      displayName: 'Resource Type',
      description: 'Type of resource to attach task to',
      required: false,
      options: {
        options: [
          { label: 'Lead', value: 'lead' },
          { label: 'Contact', value: 'contact' },
          { label: 'Deal', value: 'deal' },
        ],
      },
    }),
    resourceId: Property.Number({
      displayName: 'Resource ID',
      description: 'ID of the lead, contact, or deal',
      required: false,
    }),
    ownerId: Property.Number({
      displayName: 'Owner ID',
      description: 'ID of the user who owns this task',
      required: false,
    }),
    completed: Property.Checkbox({
      displayName: 'Completed',
      description: 'Mark task as completed',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const taskData: any = {
      data: {
        content: context.propsValue.content,
      },
    };

    if (context.propsValue.dueDate) taskData.data.due_date = context.propsValue.dueDate;
    if (context.propsValue.remindAt) taskData.data.remind_at = context.propsValue.remindAt;
    if (context.propsValue.resourceType) taskData.data.resource_type = context.propsValue.resourceType;
    if (context.propsValue.resourceId) taskData.data.resource_id = context.propsValue.resourceId;
    if (context.propsValue.ownerId) taskData.data.owner_id = context.propsValue.ownerId;
    if (context.propsValue.completed !== undefined) taskData.data.completed = context.propsValue.completed;

    const response = await makeZendeskSellRequest<{ data: Task }>(
      context.auth,
      HttpMethod.POST,
      '/tasks',
      taskData
    );

    return {
      success: true,
      task: response.data,
    };
  },
});