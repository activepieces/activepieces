import { createAction, Property } from '@activepieces/pieces-framework';
import { lettaAuth } from '../../common/auth';
import { lettaApi } from '../../common/client';
import { lettaProps } from '../../common/props';
import { lettaSchemas } from '../../common/schemas';
import type { AgentUpdateParams } from '../../common/types';

export const lettaUpdateAgent = createAction({
  auth: lettaAuth,
  name: 'letta_update_agent',
  displayName: 'Update Agent',
  description: 'Updates an agent\'s name, model, prompt, description or tags.',
  classification: 'WRITE',
  audience: 'ai',
  outputSchema: lettaSchemas.agent,
  aiMetadata: {
    description:
      'Updates a Letta agent with PATCH semantics: only the fields you fill are sent, empty fields are left unchanged. Tags, when given, replace the whole tag list; set Clear Tags to yes (without Tags) to remove all tags. Use Attach/Detach Tool and the block tools to change tools and memory instead. Idempotent: repeating the same update leaves the same state.',
    idempotent: true,
  },
  props: {
    agent_id: lettaProps.aiId({ displayName: 'Agent ID', description: 'The agent ID (agent-...). Get it from List Agents.' }),
    name: Property.ShortText({ displayName: 'Name', description: 'New agent name.', required: false }),
    model: Property.ShortText({ displayName: 'Model', description: 'New model handle from List Models.', required: false }),
    embedding: Property.ShortText({ displayName: 'Embedding Model', description: 'New embedding handle.', required: false }),
    system: Property.LongText({ displayName: 'System Prompt', description: 'New system prompt.', required: false }),
    description: Property.ShortText({ displayName: 'Description', description: 'New description.', required: false }),
    tags: Property.Array({ displayName: 'Tags', description: 'Replaces all tags on the agent.', required: false }),
    clear_tags: lettaProps.aiYesNo({ displayName: 'Clear Tags', description: 'yes = remove every tag from the agent. Cannot be combined with Tags.' }),
  },
  async run({ auth, propsValue }) {
    const client = await lettaApi.getLettaClient({ auth: auth.props });
    const agentId = lettaApi.requireText({ value: propsValue.agent_id, name: 'Agent ID' });
    const tags = lettaApi.toStringArray(propsValue.tags);
    const clearTags = lettaApi.resolveYesNo(propsValue.clear_tags) === true;
    if (clearTags && tags !== undefined) {
      throw new Error('Use either Tags or Clear Tags, not both.');
    }
    const body: AgentUpdateParams = {
      name: lettaApi.optionalText(propsValue.name),
      model: lettaApi.optionalText(propsValue.model),
      embedding: lettaApi.optionalText(propsValue.embedding),
      system: lettaApi.optionalText(propsValue.system),
      description: lettaApi.optionalText(propsValue.description),
      tags: clearTags ? [] : tags,
    };
    if (Object.values(body).every((value) => value === undefined)) {
      throw new Error('Provide at least one field to update.');
    }
    const agent = await lettaApi.callLetta(() => client.agents.update(agentId, body));
    return lettaApi.mapAgent(agent);
  },
});
