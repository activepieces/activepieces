import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wcRequest } from '../client';

export const askQuestion = createAction({
  name: 'ask_question',
  displayName: 'Ask Question',
  description: "Send a question to your Wonderchat bot; returns the bot's answer.",
  props: {
    botId: Property.ShortText({
      displayName: 'Bot ID',
      required: true,
    }),
    question: Property.LongText({
      displayName: 'Question',
      required: true,
    }),
    conversationId: Property.ShortText({
      displayName: 'Conversation ID',
      required: false,
      description: 'Optional conversation/session identifier to continue a chat.',
    }),
    // Add any other fields supported by the API (e.g., metadata, language, etc.)
  },
  async run(ctx) {
    const apiKey = ctx.auth as string;
    const { botId, question, conversationId } = ctx.propsValue;

    // TODO: Verify endpoint and payload with Wonderchat docs.
    const result = await wcRequest<any>({
      apiKey,
      method: HttpMethod.POST,
      url: `/api/v1/bots/${botId}/ask`, // TODO: confirm path
      body: {
        question,
        conversationId,
      },
    });

    return result;
  },
});