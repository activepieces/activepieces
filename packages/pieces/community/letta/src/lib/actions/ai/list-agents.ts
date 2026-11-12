import { createAction, Property } from '@activepieces/pieces-framework';
import { lettaAuth } from '../../common/auth';
import { lettaApi } from '../../common/client';
import { lettaProps } from '../../common/props';
import { lettaSchemas } from '../../common/schemas';
import type { AgentListParams } from '../../common/types';

export const lettaListAgents = createAction({
  auth: lettaAuth,
  name: 'letta_list_agents',
  displayName: 'List Agents',
  description: 'Lists agents, optionally filtered by name, text or tags.',
  classification: 'SEARCH',
  audience: 'ai',
  outputSchema: lettaSchemas.agentList,
  aiMetadata: {
    description:
      'Lists Letta agents (newest first by default) with optional filters: exact name, free-text query over agent names, and tags (match any, or all when Match All Tags is yes). Returns one page plus next_cursor; pass it as After to page. Use to find an agent ID for other Letta tools. Read-only.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Exact agent name to match.', required: false }),
    query_text: Property.ShortText({ displayName: 'Search Text', description: 'Free-text search over agent names.', required: false }),
    tags: Property.Array({ displayName: 'Tags', description: 'Only agents carrying these tags.', required: false }),
    match_all_tags: lettaProps.aiYesNo({ displayName: 'Match All Tags', description: 'yes = agent must have every tag; no (default) = any tag.' }),
    limit: lettaProps.aiLimit({ max: 100 }),
    after: lettaProps.aiAfter(),
    order: lettaProps.aiOrder(),
  },
  async run({ auth, propsValue }) {
    const client = await lettaApi.getLettaClient({ auth: auth.props });
    const limit = lettaApi.resolveLimit({ limit: propsValue.limit, max: 100, fallback: 50 });
    const query: AgentListParams = {
      limit,
      after: lettaApi.optionalText(propsValue.after),
      order: lettaProps.toOrder(propsValue.order),
      name: lettaApi.optionalText(propsValue.name),
      query_text: lettaApi.optionalText(propsValue.query_text),
      tags: lettaApi.toStringArray(propsValue.tags),
      match_all_tags: lettaApi.resolveYesNo(propsValue.match_all_tags),
      include: ['agent.tags'],
    };
    const page = await lettaApi.callLetta(() => client.agents.list(query));
    return lettaApi.toPage({ items: page.getPaginatedItems().map(lettaApi.mapAgentSummary), limit, cursorOf: (agent) => agent.id });
  },
});
