import { createAction, Property } from '@activepieces/pieces-framework';
import { chaindeskAuth } from '../common/auth';
import { agentIdDropdown } from '../common/props';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { BASE_URL } from '../common/constants';

export const queryAgentAction = createAction({
  displayName: 'Query Agent',
  name: 'query-agent',
  auth: chaindeskAuth,
  description: 'Asks question to your Agent.',
  audience: 'both',
  aiMetadata: { description: 'Sends a query to a specific Chaindesk agent (selected by agent ID) and returns its generated answer. Use to get a conversational AI response grounded in the agent\'s configured datastores. Pass a conversation ID to continue an existing thread, or omit it to start a new conversation. Not idempotent: each call is a generative request and may create a new conversation.', idempotent: false },
  props: {
    agentId: agentIdDropdown,
    query: Property.LongText({
      displayName: 'Query',
      required: true,
    }),
    conversationId: Property.LongText({
      displayName: 'Conversation ID',
      required: false,
      description:
        'ID of the conversation (If not provided a new conversation is created).',
    }),
  },
  async run(context) {
    const { agentId, query, conversationId } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: BASE_URL + `/agents/${agentId}/query`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      body: {
        query,
        conversationId,
      },
    });

    return response.body;
  },
});
