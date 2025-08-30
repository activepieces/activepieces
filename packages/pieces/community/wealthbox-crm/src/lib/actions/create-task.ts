import { Property, createAction } from '@activepieces/pieces-framework';
import { wealthboxCrmAuth } from '../../';
import { makeClient, wealthboxCommon } from '../common';

export const createTaskAction = createAction({
  auth: wealthboxCrmAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Creates tasks tied to contacts with due dates and assignment types',
  props: {
    subject: Property.ShortText({
      displayName: 'Task Subject',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    contact_id: wealthboxCommon.contactId,
    due_date: Property.DateTime({
      displayName: 'Due Date',
      required: false,
    }),
    assignee_type: Property.StaticDropdown({
      displayName: 'Assignee Type',
      required: true,
      options: {
        options: [
          { label: 'User', value: 'user' },
          { label: 'Team', value: 'team' },
        ],
      },
    }),
    assignee_id: Property.DynamicProperties({
      displayName: 'Assignee',
      required: true,
      refreshers: ['assignee_type'],
      properties: async ({ assignee_type }) => {
        if (assignee_type === 'user') {
          return {
            user_id: wealthboxCommon.userId,
          };
        } else {
          return {
            team_id: wealthboxCommon.teamId,
          };
        }
      },
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      required: false,
      options: {
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
        ],
      },
    }),
    tags: Property.Array({
      displayName: 'Tags',
      required: false,
      items: Property.ShortText({
        displayName: 'Tag',
        required: true,
      }),
    }),
  },
  async run(context) {
    const { subject, description, contact_id, due_date, assignee_type, assignee_id, priority, tags } = context.propsValue;
    
    const client = makeClient(context.auth);
    
    const taskData: any = {
      subject,
      contact_id,
    };

    if (description) taskData.description = description;
    if (due_date) taskData.due_date = due_date;
    if (priority) taskData.priority = priority;
    if (tags && tags.length > 0) taskData.tags = tags;

    if (assignee_type === 'user') {
      taskData.user_id = assignee_id.user_id;
    } else {
      taskData.team_id = assignee_id.team_id;
    }

    const result = await client.createTask(taskData);
    
    return result;
  },
});
