import { afforaiAuth } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

export const askChatbotAction = createAction({
  auth: afforaiAuth,
  name: 'afforai_ask_chatbot',
  classification: 'READ',
  displayName: 'Ask Chatbot',
  description: 'Ask one of your Afforai chatbots a question and get its answer.',
  audience: 'both',
  aiMetadata: { description: 'Sends a conversation history to a specific Afforai chatbot (identified by its Chatbot/session ID) and returns an AI-generated reply grounded in that chatbot\'s documents. Choose this to query an existing knowledge base rather than to manage documents. Optionally enable deeper document search and/or live Google search to broaden sources. Not idempotent: each call produces a fresh, potentially different completion.', idempotent: false },
  propertyGroups: [
    {
      key: 'conversation',
      display: 'section',
      label: 'Conversation',
      icon: 'reply',
      props: ['sessionID', 'history'],
    },
    {
      key: 'search',
      display: 'section',
      label: 'Search Options',
      icon: 'sliders',
      props: ['powerful', 'google'],
    },
  ],
  props: {
    sessionID: Property.ShortText({
      displayName: 'Chatbot ID',
      required: true,
      description: `Find it in Afforai under the chatbot's Actions menu > Settings.`,
    }),
    history: Property.Array({
      displayName: 'Chat History',
      required: true,
      description: 'One row per message, oldest first.',
      properties: {
        role: Property.StaticDropdown({
          displayName: 'Role',
          description: `User for your messages, Assistant for the chatbot's replies.`,
          required: true,
          options: {
            options: [
              {
                label: 'User',
                value: 'user',
              },
              {
                label: 'Assistant',
                value: 'assistant',
              },
            ],
          },
        }),
        content: Property.LongText({
          displayName: 'Message',
          required: true,
        }),
      },
    }),
    powerful: Property.Checkbox({
      displayName: 'Deep File Search',
      description: `Search the chatbot's files more thoroughly before answering.`,
      required: false,
      defaultValue: false,
    }),
    google: Property.Checkbox({
      displayName: 'Google Search',
      description: `Also look for answers on Google, not only in the chatbot's files.`,
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { sessionID, history, powerful, google } = context.propsValue;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: 'https://api.afforai.com/api/api_completion',
      body: {
        apiKey: context.auth,
        sessionID,
        history,
        powerful: powerful ?? false,
        google: google ?? false,
      },
    };

    const res = await httpClient.sendRequest(request);
    return res.body;
  },
});
