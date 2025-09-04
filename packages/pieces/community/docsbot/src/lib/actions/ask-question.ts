import { createAction, Property } from '@activepieces/pieces-framework';
import { DocsBotAuth } from '../common/auth';
import { docsbotCommon } from '../common/dropdown';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const askQuestion = createAction({
  auth: DocsBotAuth,
  name: 'askQuestion',
  displayName: 'Ask Question',
  description: 'Ask a question to a specific bot and get an answer based on its sources.',
  props: {
    teamId: docsbotCommon.teamId,
    botId: docsbotCommon.botId,
    question: Property.ShortText({
      displayName: 'Question',
      required: true,
      description: 'The question you want to ask the bot.',
    }),
  },
  async run({ auth, propsValue }) {
    const { teamId, botId, question } = propsValue;

    const request = {
      method: HttpMethod.POST,
      url: `https://docsbot.ai/api/teams/${teamId}/bots/${botId}/ask`,
      headers: {
        Authorization: `Bearer ${auth}`,
        "Content-Type": "application/json",
      },
      body: {
        question,
      },
    };

    const response = await httpClient.sendRequest(request);
    return response.body;
  },
});