import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsListConversationsOutputSchema } from '../../output-schemas';

export const listConversations = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_list_conversations',
  outputSchema: elevenlabsListConversationsOutputSchema,
  displayName: 'List Conversations',
  description: 'List agent conversations',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists conversations with their ids, agent, duration and success status. Filter by agent, outcome or start time and page with next_cursor. Use to find a conversation_id.',
    idempotent: true,
  },
  props: {
    agentId: Property.ShortText({ displayName: 'Agent ID', description: 'Only this agent', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'next_cursor from a previous call', required: false }),
    callSuccessful: Property.StaticDropdown({ displayName: 'Call Successful', required: false, options: { options: [{ label: 'success', value: 'success' }, { label: 'failure', value: 'failure' }, { label: 'unknown', value: 'unknown' }] } }),
    callStartAfterUnix: Property.Number({ displayName: 'Call Start After Unix', description: 'Unix time lower bound', required: false }),
    callStartBeforeUnix: Property.Number({ displayName: 'Call Start Before Unix', description: 'Unix time upper bound', required: false }),
    userId: Property.ShortText({ displayName: 'User ID', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> & { conversations: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/convai/conversations`,
      queryParams: { agent_id: propsValue.agentId, cursor: propsValue.cursor, call_successful: propsValue.callSuccessful, call_start_after_unix: propsValue.callStartAfterUnix, call_start_before_unix: propsValue.callStartBeforeUnix, user_id: propsValue.userId },
    });
    return { ...response, count: response.conversations.length };
  },
});
