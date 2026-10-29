import { createAction, Property } from '@activepieces/pieces-framework';
import { lettaAuth } from '../../common/auth';
import { lettaApi } from '../../common/client';
import { lettaProps } from '../../common/props';
import { lettaSchemas } from '../../common/schemas';

export const lettaInsertArchivalMemory = createAction({
  auth: lettaAuth,
  name: 'letta_insert_archival_memory',
  displayName: 'Insert Archival Memory',
  description: 'Saves text to an agent\'s archival memory.',
  classification: 'WRITE',
  audience: 'ai',
  outputSchema: lettaSchemas.insertedPassages,
  aiMetadata: {
    description:
      'Stores a text passage in a Letta agent\'s archival (long-term) memory, optionally tagged, so the agent can recall it later via search. Returns the stored passages without embedding vectors. Not idempotent: repeating stores a duplicate passage.',
    idempotent: false,
  },
  props: {
    agent_id: lettaProps.aiId({ displayName: 'Agent ID', description: 'The agent ID (agent-...). Get it from List Agents.' }),
    text: Property.LongText({ displayName: 'Text', description: 'The text to remember.', required: true }),
    tags: Property.Array({ displayName: 'Tags', description: 'Tags to attach to the passage.', required: false }),
  },
  async run({ auth, propsValue }) {
    const client = await lettaApi.getLettaClient({ auth: auth.props });
    const agentId = lettaApi.requireText({ value: propsValue.agent_id, name: 'Agent ID' });
    const text = lettaApi.requireText({ value: propsValue.text, name: 'Text' });
    const response = await lettaApi.callLetta(() =>
      client.post<unknown>(`${lettaApi.agentPath(agentId)}/archival-memory`, {
        body: { text, tags: lettaApi.toStringArray(propsValue.tags) },
      })
    );
    const items = lettaApi.mapPassages(response);
    return { items, count: items.length };
  },
});
