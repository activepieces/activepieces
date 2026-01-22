import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wonderchatAuth } from '../..';

export const askQuestion = createAction({
  name: 'askQuestion',
  displayName: 'Ask Question',
  description:
    'Sends a question to a Wonderchat bot; returns the bot’s answer.',
  auth: wonderchatAuth,
  props: {
    chatbotId: Property.ShortText({
      displayName: 'Chatbot Id',
      description: 'The ID of your chatbot (can be found in the URL when viewing your bot: /bot/YOUR_BOT_ID)',
      required: true,
    }),
    question: Property.LongText({
      displayName: 'Question',
      description: 'The question you wish to ask your chatbot',
      required: true,
    }),
    chatlogId: Property.ShortText({
      displayName: 'Chatlog Id',
      description:
        'The ID of your chat session (can be found under Chatlog Details section, labeled as "ID")',
      required: false,
    }),
    context: Property.LongText({
      displayName: 'Custom context',
      description: 'Additional custom context about the chat session (e.g., user information)',
      required: false,
    }),
    contextUrl: Property.LongText({
      displayName: 'Context URL',
      description: 'URL of the page the user is on to provide additional context',
      required: false,
    }),
  },

  async run({propsValue}) {
    const { chatbotId, question, chatlogId, context, contextUrl } = propsValue;

    const requestbody: any = {
      chatbotId,
      question,
    };
    if (chatlogId) {
      requestbody.chatlogId = chatlogId;
    }
    if (context) {
      requestbody.context = context;
    }
    if (contextUrl) {
      requestbody.contextUrl = contextUrl;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://app.wonderchat.io/api/v1/chat',
      headers: { 'Content-Type': 'application/json' },
      body: requestbody,
    });
    return response.body;
  },
});
