import { createAction, Property } from '@activepieces/pieces-framework';
import { ChatDataClient } from '../common/client';

export const updateBasePrompt = createAction({
  name: 'update_base_prompt',
  displayName: 'Update Base Prompt',
  description: 'Update the base prompt of a chatbot',
  props: {
    chatbotId: Property.ShortText({
      displayName: 'Chatbot ID',
      description: 'ID of the chatbot',
      required: true,
    }),
    newPrompt: Property.LongText({
      displayName: 'New Prompt',
      description: 'The new base prompt for the chatbot',
      required: true,
    }),
  },
  async run(context) {
    const client = new ChatDataClient(context.auth);
    return await client.updateBasePrompt(context.propsValue.chatbotId, context.propsValue.newPrompt);
  },
});