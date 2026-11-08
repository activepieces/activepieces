import { createAction } from '@activepieces/pieces-framework';
import { lettaAuth } from '../../common/auth';
import { lettaApi } from '../../common/client';
import { lettaProps } from '../../common/props';
import { lettaSchemas } from '../../common/schemas';

export const lettaAttachTool = createAction({
  auth: lettaAuth,
  name: 'letta_attach_tool',
  displayName: 'Attach Tool',
  description: 'Attaches a tool to an agent.',
  classification: 'WRITE',
  audience: 'ai',
  outputSchema: lettaSchemas.agentToolLink,
  aiMetadata: {
    description:
      'Attaches an existing tool to a Letta agent so the agent can call it. Returns the agent\'s resulting tool list. Idempotent in intent: attaching an attached tool leaves the same set.',
    idempotent: true,
  },
  props: {
    agent_id: lettaProps.aiId({ displayName: 'Agent ID', description: 'The agent ID (agent-...). Get it from List Agents.' }),
    tool_id: lettaProps.aiId({ displayName: 'Tool ID', description: 'The tool ID (tool-...). Get it from List Tools.' }),
  },
  async run({ auth, propsValue }) {
    const client = await lettaApi.getLettaClient({ auth: auth.props });
    const agentId = lettaApi.requireText({ value: propsValue.agent_id, name: 'Agent ID' });
    const toolId = lettaApi.requireText({ value: propsValue.tool_id, name: 'Tool ID' });
    const agent = await lettaApi.callLetta(() => client.agents.tools.attach(toolId, { agent_id: agentId }));
    return { agent_id: agentId, tool_id: toolId, tools: (agent?.tools ?? []).map(lettaApi.mapToolRef) };
  },
});
