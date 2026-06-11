import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { aiAnswerConfig } from '../common/models';
import { aiAnswerAuth } from '../auth';

export const gmailGetListOfAgents = createAction({
  name: 'gmailGetListOfAgents',
  auth: aiAnswerAuth,
  displayName: 'Gmail get list of Agents',
  description: 'get the lists of agents with Gmail',
  audience: 'both',
  aiMetadata: { description: 'Lists the available Gmail-connected AI Answer agents on the account, returning their IDs. Use this to discover a valid agent ID before initiating or scheduling a call (those actions require an agent ID). Takes no input; read-only and idempotent.', idempotent: true },
  props: {},
  async run(context) {
    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.GET,
      url: `${aiAnswerConfig.baseUrl}/gmail/list_agents`,
      headers: {
        [aiAnswerConfig.accessTokenHeaderKey]: context.auth.secret_text,
        },
    });
    return res.body;
  },
});
