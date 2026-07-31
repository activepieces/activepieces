import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { ringcentralAuth } from '../common/auth';
import { ringcentralApiCall } from '../common/client';
import { chatAssigneesDropdown, chatDropdown } from '../common/props';

export const createChatTask = createAction({
  auth: ringcentralAuth,
  name: 'create_chat_task',
  displayName: 'Post Task',
  description: 'Create a task in a Team Messaging chat, team, or direct message',
  props: {
    chatId: chatDropdown,
    subject: Property.ShortText({
      displayName: 'Subject',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      required: false,
    }),
    assigneeIds: chatAssigneesDropdown,
  },
  async run(context) {
    const { chatId, subject, description, dueDate, assigneeIds } = context.propsValue;

    return ringcentralApiCall({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: `/team-messaging/v1/chats/${chatId}/tasks`,
      body: {
        subject,
        description,
        dueDate,
        assignees: (assigneeIds ?? []).map((id: string) => ({ id })),
      },
    });
  },
});
