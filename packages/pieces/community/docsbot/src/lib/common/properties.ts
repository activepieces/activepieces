import { Property } from '@activepieces/pieces-framework';
import { docsbotCommon } from '.';

// Base reusable properties
const teamProperty = ({
  displayName,
  description,
}: {
  displayName?: string;
  description?: string;
}) =>
  Property.Dropdown({
    displayName: displayName || 'Team',
    description: description || 'The team to use.',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your account first.',
          options: [],
        };
      }
      const teams = await docsbotCommon.listTeams(auth as string);
      return {
        options: teams.body.map((team) => ({
          label: team.name,
          value: team.id,
        })),
      };
    },
  });

const botProperty = ({
  displayName,
  description,
}: {
  displayName?: string;
  description?: string;
}) =>
  Property.Dropdown({
    displayName: displayName || 'Bot',
    description: description || 'The bot to use.',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth, teamId }) => {
      if (!auth || !teamId) {
        return {
          disabled: true,
          placeholder: 'Please select a team first.',
          options: [],
        };
      }
      const apiKey = auth as string;
      const bots = await docsbotCommon.listBots({
        apiKey,
        teamId: teamId as string,
      });
      return {
        options: bots.body.map((bot) => ({
          label: bot.name,
          value: bot.id,
        })),
      };
    },
  });

// Action properties

export const askQuestion = () => ({
  teamId: teamProperty({}),
  botId: botProperty({}),
  question: Property.LongText({
    displayName: 'Question',
    required: true,
    description:
      'The question to ask the bot. 2 to 500 characters. Max increased to 8K tokens (roughtly 32k chars) when authenticated.',
  }),
  conversationId: Property.ShortText({
    displayName: 'Conversation ID',
    description:
      'The conversation ID to maintain the chat. This should be a UUID that you generate on your side and change to start a new conversation.',
    required: true,
  }),
  metadata: Property.Object({
    displayName: 'Metadata',
    description:
      'A user identification object with arbitrary metadata about the user. Will be saved to the question and conversation. Keys referrer, email, and name are shown in question history logs. Optional, defaults to null.',
    required: false,
  }),
  context_items: Property.Number({
    displayName: 'Context Items',
    description:
      'Number of sources to lookup for the bot to answer from. Optional, default is 5. Research mode uses 16 (more expensive token usage).',
    required: false,
  }),
  human_escalation: Property.Checkbox({
    displayName: 'Human Escalation',
    description:
      'Whether to enable human escalation for this question. Optional, default is false.',
    required: false,
  }),
  followup_rating: Property.Checkbox({
    displayName: 'Follow-up Rating',
    description:
      'Whether to ask the user for a follow-up rating after the question is answered. Optional, default is false.',
    required: false,
  }),
  document_retriever: Property.Checkbox({
    displayName: 'Document Retriever',
    description:
      'Whether to use the document retriever for this question. Optional, default is false.',
    required: false,
  }),
  full_source: Property.Checkbox({
    displayName: 'Full Source',
    description:
      'Whether to return the full source content in the response. Optional, default is false.',
    required: false,
  }),
  autocut: Property.Number({
    displayName: 'Autocut',
    description: 'Autocut results to num groups. Optional, defaults to false.',
    required: false,
  }),
  testing: Property.Checkbox({
    displayName: 'Testing',
    description:
      'Whether the request is for testing purposes. Optional, defaults to false.',
    required: false,
  }),
  image_urls: Property.Array({
    displayName: 'Image URLs',
    description:
      'List of image URLs to include with the question as context. Optional, defaults to null.',
    required: false,
  }),
  model: Property.ShortText({
    displayName: 'Model',
    description:
      'Override the model used for this request. Requires an OpenAI API key to be set on your team. Optional, defaults to the model configured for the bot.',
    required: false,
  }),
  default_language: Property.ShortText({
    displayName: 'Default Language',
    description:
      "The default language to use if the language of the conversation is unclear. Use locale codes like 'en' or 'en-US'. Optional, defaults to the bot's configured language.",
    required: false,
  }),
  reasoning_effort: Property.StaticDropdown({
    displayName: 'Reasoning Effort',
    description:
      'Reasoning depth for the response. Requires authentication to override default.',
    required: false,
    options: {
      options: [
        { label: 'Minimal', value: 'minimal' },
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
      ],
    },
  }),
});

export const createSource = () => ({
  teamId: teamProperty({}),
  botId: botProperty({}),
  type: Property.StaticDropdown({
    displayName: 'Type',
    description:
      'Can be url, document, sitemap, wp, urls, csv, rss, qa, youtube. All but url, sitemap, and youtube require uploading a formatted file.',
    required: true,
    options: {
      options: [
        { label: 'URL', value: 'url' },
        { label: 'Document', value: 'document' },
        { label: 'Sitemap', value: 'sitemap' },
        { label: 'WP', value: 'wp' },
        { label: 'Multiple URLs', value: 'urls' },
        { label: 'CSV', value: 'csv' },
        { label: 'RSS', value: 'rss' },
        { label: 'Q&A', value: 'qa' },
        { label: 'YouTube', value: 'youtube' },
      ],
    },
  }),
  title: Property.ShortText({
    displayName: 'Title',
    description: 'The source title. Required only for document type.',
    required: false,
  }),
  url: Property.ShortText({
    displayName: 'URL',
    description:
      'The source url. Optional except for url, sitemap, youtube, and rss types.',
    required: false,
  }),
  file: Property.ShortText({
    displayName: "File URL",
    description:
      'The source file path. Required if type is urls, csv, document, or wp. The is usually the cloud storage path from the Upload Source File action.',
    required: false,
  }),
  faqs: Property.Array({
    displayName: 'FAQs',
    description:
      'An array of question and answer objects. Required if type is qa.',
    required: false,

    properties: {
      question: Property.LongText({
        displayName: 'Question',
        required: true,
        description: 'The question.',
      }),
      answer: Property.LongText({
        displayName: 'Answer',
        required: true,
        description: 'The answer.',
      }),
    },
  }),
  scheduleInterval: Property.StaticDropdown({
    displayName: 'Schedule Interval',
    description:
      'The source refresh scheduled interval. Can be daily, weekly, monthly, or none depending on your plan. Optional, defaults to none.',
    required: false,
    options: {
      options: [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'None', value: 'none' },
      ],
    },
  }),
});

export const uploadSourceFile = () => ({
  teamId: teamProperty({}),
  botId: botProperty({}),
  file: Property.File({
    displayName: 'File',
    description: 'The file to upload.',
    required: true,
  }),
});

export const createBot = () => ({
  teamId: teamProperty({}),
  name: Property.ShortText({
    displayName: 'Name',
    description: 'The bot name. Used publically.',
    required: true,
  }),
  description: Property.LongText({
    displayName: 'Description',
    description: 'The bot description. Shown by default in embeds and share links.',
    required: true,
  }),
  privacy: Property.StaticDropdown({
    displayName: 'Privacy',
    description: 'The bot privacy. Can be public or private.',
    required: true,
    options: {
      options: [
        { label: 'Public', value: 'public' },
        { label: 'Private', value: 'private' },
      ],
    },
  }),
  language: Property.StaticDropdown({
    displayName: 'Language',
    description: 'The bot language.',
    required: true,
    options: {
      options: [
        { label: 'English', value: 'en' },
        { label: 'Japanese', value: 'jp' },
      ],
    },
  }),
  model: Property.ShortText({
    displayName: 'Model',
    description: 'The OpenAI model.',
    required: false,
  }),
  embeddingModel: Property.StaticDropdown({
    displayName: 'Embedding Model',
    description: 'The embedding model. Currently supports text-embedding-ada-002, text-embedding-3-large, text-embedding-3-small, embed-multilingual-v3.0, and embed-v4.0 (Cohere) depending on your plan.',
    required: false,
    options: {
      options: [
        { label: 'Text Embedding ADA 002', value: 'text-embedding-ada-002' },
        { label: 'Text Embedding 3 Large', value: 'text-embedding-3-large' },
        { label: 'Text Embedding 3 Small', value: 'text-embedding-3-small' },
        { label: 'Embed Multilingual V3.0', value: 'embed-multilingual-v3.0' },
        { label: 'Embed V4.0', value: 'embed-v4.0' },
      ],
    },
  }),
  copyFrom: Property.ShortText({
    displayName: 'Copy From',
    description: 'The ID of an existing bot in your team to copy from. If provided, the new bot will be created as a copy of the specified bot, with all sources copied over after creation.',
    required: false,
  }),
});

export const findBot = () => ({
  teamId: teamProperty({}),
  name: Property.ShortText({
    displayName: 'Name',
    description: 'The bot name.',
    required: true,
  }),
});
