import { createAction, Property } from '@activepieces/pieces-framework';
import { DocsBotAuth } from '../common/auth';
import { docsbotCommon } from '../common/dropdown';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { randomUUID } from 'crypto';

export const askQuestion = createAction({
  auth: DocsBotAuth,
  name: 'askQuestion',
  displayName: 'Ask Question',
  description: 'Ask a question to a specific bot and get an answer based on its sources.',
props: {
    teamId: docsbotCommon.teamId,
    botId: docsbotCommon.botId,
    conversationId: Property.ShortText({
      displayName: 'Conversation ID',
      required: false,
      description:
        'UUID for maintaining conversation context. Leave empty to auto-generate a new one.',
    }),
    question: Property.LongText({
      displayName: 'Question',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    // eslint-disable-next-line prefer-const
    let { teamId, botId, conversationId, question } = propsValue;

    if (!conversationId) {
      conversationId = randomUUID();
    }

    const request = {
      method: HttpMethod.POST,
      url: `https://api.docsbot.ai/teams/${teamId}/bots/${botId}/chat-agent`,
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body: {
        conversationId,
        question,
        human_escalation: false,
        followup_rating: false,
        document_retriever: true,
        full_source: false,
        stream: false,
      },
    };

    const response = await httpClient.sendRequest(request);
    return response.body;
  },
});