import { createAction, Property } from '@activepieces/pieces-framework';
import { guideliteAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { assistantIdDropdown } from '../common/props';

export const sendAPrompt = createAction({
  auth: guideliteAuth,
  name: 'sendAPrompt',
  displayName: 'Send a Prompt',
  description: 'Send a message to a Guidelite Assistant',
  props: {
    assistantId: assistantIdDropdown,
    message: Property.LongText({
      displayName: 'Message',
      description: 'The input message to be processed by the assistant',
      required: true,
    }),
    conversationId: Property.ShortText({
      displayName: 'Conversation ID',
      description:
        'The Conversation ID of the previous conversation. If empty, a new conversation will be created',
      required: false,
    }),
  },
  async run(context) {
    const { assistantId, message, conversationId } = context.propsValue;

    const body: any = {
      assistantId,
      message,
    };

    if (conversationId) {
      body.conversationId = conversationId;
    }
    const response = await makeRequest(
      context.auth,
      HttpMethod.POST,
      `/interface-assistant/chat`,
      body
    );

    return response.body;
  },
});
