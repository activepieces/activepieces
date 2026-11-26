import { createAction, Property } from '@activepieces/pieces-framework';
import { chaindeskAuth } from '../common/auth';
import { agentIdDropdown } from '../common/props';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { BASE_URL } from '../common/constants';
import { chaindeskOutputSchemas } from '../common/output-schemas';
import { withNotFoundHint } from '../common/errors';

export const queryAgentAction = createAction({
  displayName: 'Query Agent',
  name: 'query-agent',
  classification: 'WRITE',
  auth: chaindeskAuth,
  description: 'Asks question to your Agent.',
  audience: 'both',
  aiMetadata: {
    description:
      "Sends a query to a specific Chaindesk (Askli) agent and returns its generated answer, the conversation ID, the visitor ID and the knowledge-base sources used. Use to get an AI answer grounded in the agent's datastores. Pass a conversation ID from an earlier answer to continue that thread, or omit it to start a new conversation. Not idempotent: each call adds messages to a conversation and consumes message credits.",
    idempotent: false,
  },
  props: {
    agentId: agentIdDropdown,
    query: Property.LongText({
      displayName: 'Query',
      required: true,
    }),
    conversationId: Property.ShortText({
      displayName: 'Conversation ID',
      required: false,
      description:
        'ID of the conversation (If not provided a new conversation is created).',
    }),
  },
  outputSchema: chaindeskOutputSchemas.queryAgent,
  async run(context) {
    const { agentId, query, conversationId } = context.propsValue;
    const trimmedConversationId = conversationId?.trim();

    const response = await withNotFoundHint({
      request: () =>
        httpClient.sendRequest({
          method: HttpMethod.POST,
          url: BASE_URL + `/agents/${encodeURIComponent(agentId)}/query`,
          redactBodyInErrors: true,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: context.auth.secret_text,
          },
          body: {
            query,
            conversationId: trimmedConversationId
              ? trimmedConversationId
              : undefined,
            streaming: false,
          },
        }),
      resourceName: 'agent',
      idempotent: false,
      notFoundMessage: trimmedConversationId
        ? `Agent ${agentId} or conversation ${trimmedConversationId} was not found, or this API key cannot access it.`
        : `Agent ${agentId} was not found, or this API key cannot access it.`,
    });

    return response.body;
  },
});
