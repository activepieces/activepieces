import { Property } from '@activepieces/pieces-framework';
import { aidbaseCommon } from '.';

export const AddVideoProperties = {
  video_url: Property.ShortText({
    displayName: 'Video URL',
    description:
      'The URL of the video to add. We currently only accept YouTube links.',
    required: true,
  }),
};

export const CreateFaqProperties = {
  title: Property.ShortText({
    displayName: 'FAQ Title',
    description: 'The title of the FAQ.',
    required: true,
  }),
  description: Property.LongText({
    displayName: 'FAQ Description',
    description: 'The description of the FAQ.',
    required: false,
  }),
};

export const StartTrainingProperties = {
  id: Property.Dropdown({
    displayName: 'Knowledge Item',
    description: 'Select the knowledge item to start training.',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
        };
      }
      const knowledgeItems = await aidbaseCommon.listKnowledgeItems({
        apiKey: auth as string,
        limit: 100,
      });
      return {
        options: knowledgeItems.items.map((item) => ({
          label: item.title,
          value: item.id,
        })),
      };
    },
  }),
};

export const AddFaqItemProperties = {
  faq_id: Property.Dropdown({
    displayName: 'FAQ',
    description: 'Select the FAQ to which the item will be added.',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
        };
      }
      const knowledgeItems = await aidbaseCommon.listKnowledgeItems({
        apiKey: auth as string,
        limit: 100,
      });
      return {
        options: knowledgeItems.items
          .filter((item) => item.type === 'faq')
          .map((item) => ({
            label: item.title,
            value: item.id,
          })),
      };
    },
  }),
  question: Property.ShortText({
    displayName: 'FAQ Question',
    description: 'The question for the FAQ.',
    required: true,
  }),
  answer: Property.LongText({
    displayName: 'FAQ Answer',
    description: 'The answer for the FAQ.',
    required: true,
  }),
  source_url: Property.ShortText({
    displayName: 'Source URL',
    description: 'The source URL for the FAQ item.',
    required: false,
  }),
  categories: Property.Array({
    displayName: 'Categories',
    description:
      'A list of category names for the FAQ. If the category does not exist, it will be created.',
    required: false,
  }),
};

export const AddWebsiteProperties = {
  website_url: Property.ShortText({
    displayName: 'Website URL',
    description: 'The URL of the website to add.',
    required: true,
  }),
};

export const CreateChatbotReplyProperties = {
  chatbot_id: Property.Dropdown({
    displayName: 'Chatbot',
    description: 'Select the chatbot to which the message will be sent.',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
        };
      }
      const chatbots = await aidbaseCommon.listChatBots(auth as string);
      console.log("Chatbots:", chatbots);
      return {
        options: chatbots.items.map((chatbot) => ({
          label: chatbot.title,
          value: chatbot.id,
        })),
      };
    },
  }),
  message: Property.LongText({
    displayName: 'Message',
    description: 'The message to send to the chatbot.',
    required: true,
  }),
  session_id: Property.ShortText({
    displayName: 'Session ID',
    description: 'The session ID for the chatbot interaction.',
    required: false,
  }),
};
