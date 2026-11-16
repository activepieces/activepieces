import { createAction } from '@activepieces/pieces-framework';
import { lettaAuth } from '../../common/auth';
import { lettaApi } from '../../common/client';
import { lettaProps } from '../../common/props';
import { lettaSchemas } from '../../common/schemas';
import type { MessageListParams } from '../../common/types';

export const lettaListAgentMessages = createAction({
  auth: lettaAuth,
  name: 'letta_list_agent_messages',
  displayName: 'List Agent Messages',
  description: 'Lists an agent\'s conversation history.',
  classification: 'SEARCH',
  audience: 'ai',
  outputSchema: lettaSchemas.messageList,
  aiMetadata: {
    description:
      'Lists messages in a Letta agent\'s history (newest first by default): user, assistant, reasoning, tool call and tool return messages with their text. Returns one page plus next_cursor for paging. Read-only.',
    idempotent: true,
  },
  props: {
    agent_id: lettaProps.aiId({ displayName: 'Agent ID', description: 'The agent ID (agent-...). Get it from List Agents.' }),
    limit: lettaProps.aiLimit({ max: 100 }),
    after: lettaProps.aiAfter(),
    order: lettaProps.aiOrder(),
  },
  async run({ auth, propsValue }) {
    const client = await lettaApi.getLettaClient({ auth: auth.props });
    const agentId = lettaApi.requireText({ value: propsValue.agent_id, name: 'Agent ID' });
    const limit = lettaApi.resolveLimit({ limit: propsValue.limit, max: 100, fallback: 50 });
    const query: MessageListParams = { limit, after: lettaApi.optionalText(propsValue.after), order: lettaProps.toOrder(propsValue.order) };
    const page = await lettaApi.callLetta(() => client.agents.messages.list(agentId, query));
    return lettaApi.toPage({ items: page.getPaginatedItems().map(lettaApi.mapMessage), limit, cursorOf: (message) => message.id });
  },
});
