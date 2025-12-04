import { createAction, Property } from '@activepieces/pieces-framework';
import { ChatDataClient } from '../common/client';
import { chatDataAuth, CreateChatbotDto } from '../common/types';

export const createChatbot = createAction({
  auth: chatDataAuth,
  name: 'create_chatbot',
  displayName: 'Create Chatbot',
  description:
    'Create and train a chatbot using custom data, medical models, or custom models. Training takes 1-2 minutes.',
  props: {
    chatbotName: Property.ShortText({
      displayName: 'Chatbot Name',
      description: 'The name of the chatbot to be created',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'Select the chatbot model. Note: sourceText and urlsToScrape are ignored for medical and custom models.',
      required: false,
      defaultValue: 'custom-data-upload',
      options: {
        options: [
          { label: 'Custom Data Upload (GPT-4o, Claude, etc.)', value: 'custom-data-upload' },
          { label: 'Medical Chat - Human', value: 'medical-chat-human' },
          { label: 'Medical Chat - Veterinarian', value: 'medical-chat-vet' },
          { label: 'Custom Model (Your own backend)', value: 'custom-model' },
        ],
      },
    }),
    sourceText: Property.LongText({
      displayName: 'Source Text',
      description:
        'Training text for the chatbot. Character limits apply based on your plan. Only used for custom-data-upload model.',
      required: false,
    }),
    urlsToScrape: Property.Array({
      displayName: 'URLs to Scrape',
      description:
        'URLs to extract content from. Must start with http:// or https:// (only for custom-data-upload model)',
      required: false,
      properties: {
        url: Property.ShortText({
          displayName: 'URL',
          description: 'Website URL starting with http:// or https://',
          required: true,
        }),
      },
    }),
    products: Property.Array({
      displayName: 'Products',
      description: 'List of products for training the chatbot',
      required: false,
      properties: {
        id: Property.ShortText({
          displayName: 'Product ID',
          description: 'Unique ID for tracking the product in the knowledge base',
          required: true,
        }),
        information: Property.Json({
          displayName: 'Product Information',
          description: 'Structured data of the product in key-value format (1-2 levels deep recommended)',
          required: true,
          defaultValue: {
            name: 'Product Name',
            price: 99.99,
            category: 'Category'
          },
        }),
      },
    }),
    qAndAs: Property.Array({
      displayName: 'Q&As',
      description: 'List of questions and answers for the chatbot to learn',
      required: false,
      properties: {
        question: Property.LongText({
          displayName: 'Question',
          description: 'The question on a specific topic',
          required: true,
        }),
        answer: Property.LongText({
          displayName: 'Answer',
          description: 'The answer to the question',
          required: true,
        }),
      },
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
    const client = new ChatDataClient(context.auth.secret_text);

    const payload = CreateChatbotDto.parse({
      chatbotName: context.propsValue.chatbotName,
      sourceText: context.propsValue.sourceText,
      urlsToScrape: context.propsValue.urlsToScrape?.map((item: any) => item.url),
      products: context.propsValue.products,
      qAndAs: context.propsValue.qAndAs,
      customBackend: context.propsValue.customBackend,
      bearer: context.propsValue.bearer,
      model: context.propsValue.model || 'custom-data-upload',
    });

    return await client.createChatbot(payload);
  },
});
