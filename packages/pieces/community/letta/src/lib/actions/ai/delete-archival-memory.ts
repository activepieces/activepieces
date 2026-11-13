import { createAction } from '@activepieces/pieces-framework';
import { lettaAuth } from '../../common/auth';
import { lettaApi } from '../../common/client';
import { lettaProps } from '../../common/props';
import { lettaSchemas } from '../../common/schemas';

export const lettaDeleteArchivalMemory = createAction({
  auth: lettaAuth,
  name: 'letta_delete_archival_memory',
  displayName: 'Delete Archival Memory',
  description: 'Deletes a passage from an agent\'s archival memory.',
  classification: 'DESTRUCTIVE',
  audience: 'ai',
  outputSchema: lettaSchemas.deletedPassage,
  aiMetadata: {
    description:
      'Permanently deletes one passage from a Letta agent\'s archival memory. Get the memory ID from List Archival Memory. Cannot be undone. Not idempotent: a second delete returns not found.',
    idempotent: false,
  },
  props: {
    agent_id: lettaProps.aiId({ displayName: 'Agent ID', description: 'The agent ID (agent-...). Get it from List Agents.' }),
    memory_id: lettaProps.aiId({ displayName: 'Memory ID', description: 'The passage ID (passage-...).' }),
  },
  async run({ auth, propsValue }) {
    const client = await lettaApi.getLettaClient({ auth: auth.props });
    const agentId = lettaApi.requireText({ value: propsValue.agent_id, name: 'Agent ID' });
    const memoryId = lettaApi.requireText({ value: propsValue.memory_id, name: 'Memory ID' });
    await lettaApi.callLetta(() =>
      client.delete<unknown>(`${lettaApi.agentPath(agentId)}/archival-memory/${encodeURIComponent(memoryId)}`)
    );
    return { agent_id: agentId, memory_id: memoryId, deleted: true };
  },
});
