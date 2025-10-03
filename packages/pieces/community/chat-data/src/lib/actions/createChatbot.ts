import { createAction, Property } from '@activepieces/pieces-framework';
import { ChatDataClient } from '../common/client';
import { CreateChatbotDto } from '../common/types';

export const createChatbot = createAction({
  name: 'create_chatbot',
  displayName: 'Create Chatbot',
  description:
    'Create and train a chatbot using custom data, medical models, or custom models',
  props: {
    chatbotName: Property.ShortText({
      displayName: 'Chatbot Name',
      description: 'The name of the chatbot to be created',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'The chatbot model to use',
      required: false,
      defaultValue: 'custom-data-upload',
      options: {
        options: [
          { label: 'Custom Data Upload', value: 'custom-data-upload' },
          { label: 'Medical Chat - Human', value: 'medical-chat-human' },
          { label: 'Medical Chat - Veterinarian', value: 'medical-chat-vet' },
          { label: 'Custom Model', value: 'custom-model' },
        ],
      },
    }),
    sourceText: Property.LongText({
      displayName: 'Source Text',
      description:
        'Text data for training the chatbot (only for custom-data-upload model)',
      required: false,
    }),
    urlsToScrape: Property.Array({
      displayName: 'URLs to Scrape',
      description:
        'List of URLs to extract content from (only for custom-data-upload model)',
      required: false,
    }),
    products: Property.Array({
      displayName: 'Products',
      description: 'List of products for training the chatbot',
      required: false,
    }),
    qAndAs: Property.Array({
      displayName: 'Q&As',
      description: 'List of questions and answers for the chatbot to learn',
      required: false,
    }),
    customBackend: Property.ShortText({
      displayName: 'Custom Backend URL',
      description: 'URL of a custom backend for the chatbot',
      required: false,
    }),
    bearer: Property.ShortText({
      displayName: 'Bearer Token',
      description: 'Authentication bearer token for custom backend',
      required: false,
    }),
  },
  async run(context) {
    const client = new ChatDataClient(context.auth as string);

    const payload = CreateChatbotDto.parse({
      chatbotName: context.propsValue.chatbotName,
      sourceText: context.propsValue.sourceText,
      urlsToScrape: context.propsValue.urlsToScrape,
      products: context.propsValue.products,
      qAndAs: context.propsValue.qAndAs,
      customBackend: context.propsValue.customBackend,
      bearer: context.propsValue.bearer,
      model: context.propsValue.model || 'custom-data-upload',
    });

    return await client.createChatbot(payload);
  },
});
