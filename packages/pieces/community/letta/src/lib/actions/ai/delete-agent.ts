import { createAction } from '@activepieces/pieces-framework';
import { lettaAuth } from '../../common/auth';
import { lettaApi } from '../../common/client';
import { lettaProps } from '../../common/props';
import { lettaSchemas } from '../../common/schemas';

export const lettaDeleteAgent = createAction({
  auth: lettaAuth,
  name: 'letta_delete_agent',
  displayName: 'Delete Agent',
  description: 'Permanently deletes an agent.',
  classification: 'DESTRUCTIVE',
  audience: 'ai',
  outputSchema: lettaSchemas.deletedAgent,
  aiMetadata: {
    description:
      'Permanently deletes a Letta agent and its message history. This cannot be undone. Not idempotent: deleting an already deleted agent returns a not-found error.',
    idempotent: false,
  },
  props: {
    agent_id: lettaProps.aiId({ displayName: 'Agent ID', description: 'The agent ID (agent-...). Get it from List Agents.' }),
  },
  async run({ auth, propsValue }) {
    const client = await lettaApi.getLettaClient({ auth: auth.props });
    const agentId = lettaApi.requireText({ value: propsValue.agent_id, name: 'Agent ID' });
    await lettaApi.callLetta(() => client.agents.delete(agentId));
    return { agent_id: agentId, deleted: true };
  },
});
