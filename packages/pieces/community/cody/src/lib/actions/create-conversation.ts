import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { makeRequest, Conversation } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createConversationAction = createAction({
  auth: codyAuth,
  name: 'create_conversation',
  displayName: 'Create Conversation',
  description: 'Creates new conversation with bot',
  props: {
    bot_id: Property.ShortText({
      displayName: 'Bot ID',
      required: true,
      description: 'The ID of the bot to start a conversation with',
    }),
    name: Property.ShortText({
      displayName: 'Conversation Name',
      required: false,
      description: 'Optional name for the conversation',
    }),
  },
  async run(context) {
    const { bot_id, name } = context.propsValue;

    const response = await makeRequest<Conversation>(
      HttpMethod.POST,
      '/conversations',
      context.auth,
      {
        bot_id,
        name,
      }
    );

    if (!response.success) {
      throw new Error(`Failed to create conversation: ${response.error}`);
    }

    return response.data;
  },
});