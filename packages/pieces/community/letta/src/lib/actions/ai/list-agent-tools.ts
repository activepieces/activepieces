import { createAction } from '@activepieces/pieces-framework';
import { lettaAuth } from '../../common/auth';
import { lettaApi } from '../../common/client';
import { lettaProps } from '../../common/props';
import { lettaSchemas } from '../../common/schemas';

export const lettaListAgentTools = createAction({
  auth: lettaAuth,
  name: 'letta_list_agent_tools',
  displayName: 'List Agent Tools',
  description: 'Lists the tools attached to an agent.',
  classification: 'SEARCH',
  audience: 'ai',
  outputSchema: lettaSchemas.toolList,
  aiMetadata: {
    description:
      'Lists the tools currently attached to a Letta agent. Returns one page plus next_cursor. Read-only.',
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
      client.agents.tools.list(agentId, { limit, after: lettaApi.optionalText(propsValue.after) })
    );
    return lettaApi.toPage({ items: page.getPaginatedItems().map(lettaApi.mapTool), limit, cursorOf: (tool) => tool.id });
  },
});
