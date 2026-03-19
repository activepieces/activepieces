import { createAction, Property } from '@activepieces/pieces-framework';
import { ChatDataClient } from '../common/client';
import { chatDataAuth, RetrainOptions } from '../common/types';

export const retrainChatbot = createAction({
  auth: chatDataAuth,
  name: 'retrain_chatbot',
  displayName: 'Retrain Chatbot',
  description:
    'Retrain an existing chatbot with new data or remove existing data (custom-data-upload model only)',
  props: {
    chatbotId: Property.Dropdown({
      auth: chatDataAuth,
      displayName: 'Chatbot',
      description: 'Select the chatbot to retrain',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }
        try {
          const client = new ChatDataClient(auth.secret_text);
          const chatbots = await client.listChatbots();
          return {
            options: chatbots.map((chatbot) => ({
              label: chatbot.name,
              value: chatbot.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load chatbots',
          };
        }
      },
    }),
    sourceText: Property.LongText({
      displayName: 'Source Text',
      description: 'New text data for training the chatbot',
      required: false,
    }),
    urlsToScrape: Property.Array({
      displayName: 'URLs to Scrape',
      description:
        'List of URLs to extract content from (existing URLs will be recrawled)',
      required: false,
      properties: {
        url: Property.ShortText({
          displayName: 'URL',
          description: 'Website URL starting with http:// or https://',
          required: true,
        }),
      },
    }),
    cookies: Property.LongText({
      displayName: 'Cookies',
      description:
        'Cookies for authorization (semicolon-separated: "cookie1=value1; cookie2=value2")',
      required: false,
    }),
    extractMainContent: Property.Checkbox({
      displayName: 'Extract Main Content',
      description:
        'Automatically remove headers, footers, nav, sidebar, and ads',
      required: false,
    }),
    includeOnlyTags: Property.ShortText({
      displayName: 'Include Only Tags',
      description: 'CSS selectors to exclusively extract (comma-separated)',
      required: false,
    }),
    excludeTags: Property.ShortText({
      displayName: 'Exclude Tags',
      description: 'CSS selectors to exclude from scraping (comma-separated)',
      required: false,
    }),
    products: Property.Array({
      displayName: 'Products',
      description:
        'List of products for training (existing products with same ID will be overwritten)',
      required: false,
      properties: {
        id: Property.ShortText({
          displayName: 'Product ID',
          description: 'Unique ID for tracking the product',
          required: true,
        }),
        information: Property.Json({
          displayName: 'Product Information',
          description: 'Structured product data in key-value format',
          required: true,
          defaultValue: {
            name: 'Product Name',
            description: 'Product description'
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
    deletes: Property.Array({
      displayName: 'Knowledge to Delete',
      description: 'List of knowledge sources to remove from the chatbot',
      required: false,
      properties: {
        type: Property.StaticDropdown({
          displayName: 'Type',
          description: 'The type of knowledge chunk to delete',
          required: true,
          options: {
            options: [
              { label: 'Website', value: 'website' },
              { label: 'Q&A', value: 'q&a' },
              { label: 'Product', value: 'product' },
              { label: 'Text', value: 'text' },
              { label: 'File', value: 'file' },
            ],
          },
        }),
        url: Property.ShortText({
          displayName: 'URL',
          description: 'The URL to delete (required if type is website)',
          required: false,
        }),
      },
    }),
  },
  async run(context) {
    const client = new ChatDataClient(context.auth.secret_text);

    const payload = RetrainOptions.parse({
      chatbotId: context.propsValue.chatbotId,
      sourceText: context.propsValue.sourceText,
      urlsToScrape: context.propsValue.urlsToScrape?.map((item: any) => item.url),
      options: {
        Cookies: context.propsValue.cookies,
        extractMainContent: context.propsValue.extractMainContent,
        includeOnlyTags: context.propsValue.includeOnlyTags,
        excludeTags: context.propsValue.excludeTags,
      },
      products: context.propsValue.products,
      qAndAs: context.propsValue.qAndAs,
      deletes: context.propsValue.deletes,
    });

    return await client.retrainChatbot(payload);
  },
});
