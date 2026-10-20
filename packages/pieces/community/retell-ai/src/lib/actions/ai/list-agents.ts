import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
export const listAgentsAction = createAction({
  auth: retellAiAuth,
  name: 'list_agents',
  classification: 'SEARCH',
  displayName: 'List Agents',
  description: 'Lists voice and chat agents.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Retell agents (one row per agent, not per version), optionally only voice or only chat agents, or those whose name or ID contains a search text. Use it to find an agent_id. Pass pagination_key to read the next page. Read-only.',
    idempotent: true,
  },
  props: {
    channel: Property.StaticDropdown({
      displayName: 'Channel',
      description: 'Optional: only voice or only chat agents.',
      required: false,
      options: { options: [{ label: 'Voice', value: 'voice' }, { label: 'Chat', value: 'chat' }] },
    }),
    search: Property.ShortText({ displayName: 'Search', description: 'Optional text matched against agent name and ID.', required: false }),
    limit: retellAiProps.limit(),
    pagination_key: retellAiProps.paginationKey(),
  },
  outputSchema: retellSchemas.agentPage,
  async run({ auth, propsValue }) {
    return listAgentsPage({
      apiKey: apiKeyOf(auth),
      channel: retellInput.optionalText(propsValue.channel),
      search: retellInput.optionalText(propsValue.search),
      limit: propsValue.limit,
      paginationKey: propsValue.pagination_key,
    });
  },
});

export async function listAgentsPage({
  apiKey,
  channel,
  search,
  limit,
  paginationKey,
}: {
  apiKey: string;
  channel: string | undefined;
  search: string | undefined;
  limit: unknown;
  paginationKey: unknown;
}) {
  const filter: Record<string, unknown> = {};
  if (channel !== undefined) {
    filter['channel'] = retellInput.stringFilter(channel);
  }
  if (search !== undefined) {
    filter['query'] = search;
  }
  const response = await retellApiCall({
    apiKey,
    method: HttpMethod.POST,
    path: '/v2/list-agents',
    query: {
      limit: retellInput.pageLimit(limit),
      pagination_key: retellInput.optionalText(paginationKey),
    },
    body: Object.keys(filter).length > 0 ? { filter_criteria: filter } : {},
    retryRateLimit: true,
  });
  return retellMap.page({ body: response, mapItem: retellMap.agentListItem });
}
