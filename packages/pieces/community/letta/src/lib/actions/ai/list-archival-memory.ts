import { createAction, Property } from '@activepieces/pieces-framework';
import { lettaAuth } from '../../common/auth';
import { lettaApi } from '../../common/client';
import { lettaProps } from '../../common/props';
import { lettaSchemas } from '../../common/schemas';

export const lettaListArchivalMemory = createAction({
  auth: lettaAuth,
  name: 'letta_list_archival_memory',
  displayName: 'List Archival Memory',
  description: 'Lists an agent\'s archival (long-term) memories.',
  classification: 'SEARCH',
  audience: 'ai',
  outputSchema: lettaSchemas.passageList,
  aiMetadata: {
    description:
      'Lists passages in a Letta agent\'s archival memory (long-term storage), optionally filtered by a text match. Embedding vectors are not returned. Returns one page plus next_cursor. Read-only.',
    idempotent: true,
  },
  props: {
    agent_id: lettaProps.aiId({ displayName: 'Agent ID', description: 'The agent ID (agent-...). Get it from List Agents.' }),
    search: Property.ShortText({ displayName: 'Search Text', description: 'Only passages whose text contains this.', required: false }),
    limit: lettaProps.aiLimit({ max: 100 }),
    after: lettaProps.aiAfter(),
    order: lettaProps.aiOrder(),
  },
  async run({ auth, propsValue }) {
    const client = await lettaApi.getLettaClient({ auth: auth.props });
    const agentId = lettaApi.requireText({ value: propsValue.agent_id, name: 'Agent ID' });
    const limit = lettaApi.resolveLimit({ limit: propsValue.limit, max: 100, fallback: 50 });
    const response = await lettaApi.callLetta(() =>
      client.get<unknown>(`${lettaApi.agentPath(agentId)}/archival-memory`, {
        query: {
          limit,
          after: lettaApi.optionalText(propsValue.after),
          search: lettaApi.optionalText(propsValue.search),
          ascending: lettaProps.toOrder(propsValue.order) === 'asc',
        },
      })
    );
    return lettaApi.toPage({ items: lettaApi.mapPassages(response), limit, cursorOf: (passage) => passage.id ?? undefined });
  },
});
