import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { missiveAuth } from '../../';
import { missiveApiCall } from '../common/utils';

export const createTaskAction = createAction({
  auth: missiveAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Create a task associated with a conversation',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the task',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The description of the task',
      required: false,
    }),
    conversationId: Property.ShortText({
      displayName: 'Conversation ID',
      description: 'The ID of the conversation to associate with the task',
      required: false,
    }),
    assigneeId: Property.ShortText({
      displayName: 'Assignee ID',
      description: 'The ID of the user to assign the task to',
      required: false,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'The due date for the task',
      required: false,
    }),
    priority: Property.Dropdown({
      displayName: 'Priority',
      description: 'The priority level of the task',
      required: false,
      refreshers: [],
      options: async () => {
        return {
          disabled: false,
          options: [
            { label: 'Low', value: 'low' },
            { label: 'Medium', value: 'medium' },
            { label: 'High', value: 'high' },
          ],
        };
      },
    }),
  },
  async run(context) {
    const { title, description, conversationId, assigneeId, dueDate, priority } = context.propsValue;
    const apiToken = context.auth.apiToken;

    const taskData: Record<string, unknown> = {
      title,
    };

    if (description) taskData.description = description;
    if (conversationId) taskData.conversation_id = conversationId;
    if (assigneeId) taskData.assignee_id = assigneeId;
    if (dueDate) taskData.due_date = dueDate;
    if (priority) taskData.priority = priority;

    const response = await missiveApiCall(
      apiToken,
      '/tasks',
      HttpMethod.POST,
      { task: taskData }
    );

    return response;
  },
}); 