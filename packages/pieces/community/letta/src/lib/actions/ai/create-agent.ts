import { createAction, Property } from '@activepieces/pieces-framework';
import { lettaAuth } from '../../common/auth';
import { lettaApi } from '../../common/client';
import { lettaProps } from '../../common/props';
import { lettaSchemas } from '../../common/schemas';
import type { CreateBlock, LettaAgentCreateParams } from '../../common/types';

export const lettaCreateAgent = createAction({
  auth: lettaAuth,
  name: 'letta_create_agent',
  displayName: 'Create Agent',
  description: 'Creates a new stateful agent.',
  classification: 'WRITE',
  audience: 'ai',
  outputSchema: lettaSchemas.agent,
  aiMetadata: {
    description:
      'Creates a new Letta agent. Model and embedding are provider/model handles from List Models (for example openai/gpt-4o-mini). Memory Blocks is a JSON array of {label, value, limit?, description?} that seeds core memory (commonly labels human and persona). Optional tags, tool IDs, existing block IDs and identity IDs are attached at creation. Not idempotent: every call creates another agent, and free plans cap the number of agents.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Agent name. Letta assigns a random name when empty.', required: false }),
    model: Property.ShortText({ displayName: 'Model', description: 'Model handle such as openai/gpt-4o-mini. Get handles from List Models.', required: false }),
    embedding: Property.ShortText({ displayName: 'Embedding Model', description: 'Embedding handle such as openai/text-embedding-3-small. Get handles from List Models with Embedding Models = yes.', required: false }),
    system: Property.LongText({ displayName: 'System Prompt', description: 'Custom system prompt. Leave empty for the default.', required: false }),
    description: Property.ShortText({ displayName: 'Description', description: 'Short description of the agent.', required: false }),
    memory_blocks: Property.Json({ displayName: 'Memory Blocks', description: 'JSON array of {"label": "human", "value": "...", "limit": 5000, "description": "..."} objects.', required: false }),
    tags: Property.Array({ displayName: 'Tags', description: 'Tags to add to the agent.', required: false }),
    tool_ids: Property.Array({ displayName: 'Tool IDs', description: 'IDs of tools to attach. Get them from List Tools.', required: false }),
    block_ids: Property.Array({ displayName: 'Block IDs', description: 'IDs of existing shared blocks to attach.', required: false }),
    identity_ids: Property.Array({ displayName: 'Identity IDs', description: 'IDs of identities to link.', required: false }),
    include_base_tools: lettaProps.aiYesNo({ displayName: 'Include Base Tools', description: 'yes (Letta default) adds the built-in memory tools; no leaves them out.' }),
  },
  async run({ auth, propsValue }) {
    const client = await lettaApi.getLettaClient({ auth: auth.props });
    const body: LettaAgentCreateParams = {
      name: lettaApi.optionalText(propsValue.name),
      model: lettaApi.optionalText(propsValue.model),
      embedding: lettaApi.optionalText(propsValue.embedding),
      system: lettaApi.optionalText(propsValue.system),
      description: lettaApi.optionalText(propsValue.description),
      memory_blocks: parseMemoryBlocks(propsValue.memory_blocks),
      tags: lettaApi.toStringArray(propsValue.tags),
      tool_ids: lettaApi.toStringArray(propsValue.tool_ids),
      block_ids: lettaApi.toStringArray(propsValue.block_ids),
      identity_ids: lettaApi.toStringArray(propsValue.identity_ids),
      include_base_tools: lettaApi.resolveYesNo(propsValue.include_base_tools),
    };
    const agent = await lettaApi.callLetta(() => client.agents.create(body));
    return lettaApi.mapAgent(agent);
  },
});

function parseMemoryBlocks(value: unknown): CreateBlock[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new Error('Memory Blocks must be a JSON array of {label, value} objects.');
  }
  return value.map((entry) => {
    if (!lettaApi.isRecord(entry)) {
      throw new Error('Each memory block must be an object with label and value.');
    }
    const label = entry['label'];
    const blockValue = entry['value'];
    const limit = entry['limit'];
    const description = entry['description'];
    if (typeof label !== 'string' || label.trim().length === 0 || typeof blockValue !== 'string') {
      throw new Error('Each memory block needs a text label and a text value.');
    }
    if (limit !== undefined && (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1)) {
      throw new Error(`Memory block "${label}" limit must be a positive whole number.`);
    }
    return {
      label: label.trim(),
      value: blockValue,
      limit: typeof limit === 'number' ? limit : undefined,
      description: typeof description === 'string' ? description : undefined,
    };
  });
}
