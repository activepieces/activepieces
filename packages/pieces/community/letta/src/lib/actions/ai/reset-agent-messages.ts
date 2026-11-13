import { createAction } from '@activepieces/pieces-framework';
import { lettaAuth } from '../../common/auth';
import { lettaApi } from '../../common/client';
import { lettaProps } from '../../common/props';
import { lettaSchemas } from '../../common/schemas';

export const lettaResetAgentMessages = createAction({
  auth: lettaAuth,
  name: 'letta_reset_agent_messages',
  displayName: 'Reset Agent Messages',
  description: 'Clears an agent\'s in-context message history.',
  classification: 'DESTRUCTIVE',
  audience: 'ai',
  outputSchema: lettaSchemas.resetMessages,
  aiMetadata: {
    description:
      'Resets a Letta agent\'s message history so the conversation starts fresh; core memory blocks are kept. Removed messages cannot be restored. Idempotent: resetting twice leaves the same empty history.',
    idempotent: true,
  },
  props: {
    agent_id: lettaProps.aiId({ displayName: 'Agent ID', description: 'The agent ID (agent-...). Get it from List Agents.' }),
    add_default_initial_messages: lettaProps.aiYesNo({ displayName: 'Add Default Initial Messages', description: 'yes = re-add Letta\'s default starter messages after the reset; no (default) = leave history empty.' }),
  },
  async run({ auth, propsValue }) {
    const client = await lettaApi.getLettaClient({ auth: auth.props });
    const agentId = lettaApi.requireText({ value: propsValue.agent_id, name: 'Agent ID' });
    await lettaApi.callLetta(() =>
      client.agents.messages.reset(agentId, { add_default_initial_messages: lettaApi.resolveYesNo(propsValue.add_default_initial_messages) ?? false })
    );
    return { agent_id: agentId, reset: true };
  },
});
