import { createAction, Property } from '@activepieces/pieces-framework';
import { ChatDataClient } from '../common/client';
import { CreateChatbotDto } from '../common/types';

export const createChatbot = createAction({
  name: 'create_chatbot',
  displayName: 'Create Chatbot',
  description: 'Create a new chatbot',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the chatbot',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the chatbot',
      required: false,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'Language of the chatbot',
      required: false,
    }),
    basePrompt: Property.LongText({
      displayName: 'Base Prompt',
      description: 'Base prompt for the chatbot',
      required: false,
    }),
  },
  async run(context) {
    const client = new ChatDataClient(context.auth);
    
    const payload = CreateChatbotDto.parse({
      name: context.propsValue.name,
      description: context.propsValue.description,
      language: context.propsValue.language,
      basePrompt: context.propsValue.basePrompt,
    });

    return await client.createChatbot(payload);
  },
});