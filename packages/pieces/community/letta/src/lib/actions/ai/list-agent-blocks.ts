import { createAction } from '@activepieces/pieces-framework';
import { lettaAuth } from '../../common/auth';
import { lettaApi } from '../../common/client';
import { lettaProps } from '../../common/props';
import { lettaSchemas } from '../../common/schemas';

export const lettaListAgentBlocks = createAction({
  auth: lettaAuth,
  name: 'letta_list_agent_blocks',
  displayName: 'List Agent Memory Blocks',
  description: 'Lists the core memory blocks of an agent.',
  classification: 'SEARCH',
  audience: 'ai',
  outputSchema: lettaSchemas.blockList,
  aiMetadata: {
    description:
      'Lists the core memory blocks attached to a Letta agent (label, value, character limit). Use to read what the agent currently remembers before updating a block. Read-only.',
    idempotent: true,
  },
  props: {
    agent_id: lettaProps.aiId({ displayName: 'Agent ID', description: 'The agent ID (agent-...). Get it from List Agents.' }),
    limit: lettaProps.aiLimit({ max: 100 }),
    after: lettaProps.aiAfter(),
  },
  async run({ auth, propsValue }) {
    const client = await lettaApi.getLettaClient({ auth: auth.props });
    const agentId = lettaApi.requireText({ value: propsValue.agent_id, name: 'Agent ID' });
    const limit = lettaApi.resolveLimit({ limit: propsValue.limit, max: 100, fallback: 50 });
    const page = await lettaApi.callLetta(() =>
      client.agents.blocks.list(agentId, { limit, after: lettaApi.optionalText(propsValue.after) })
    );
    return lettaApi.toPage({ items: page.getPaginatedItems().map(lettaApi.mapBlock), limit, cursorOf: (block) => block.id });
  },
});
