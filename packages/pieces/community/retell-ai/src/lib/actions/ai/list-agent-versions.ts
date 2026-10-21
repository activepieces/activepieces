import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
export const listAgentVersionsAction = createAction({
  auth: retellAiAuth,
  name: 'list_agent_versions',
  classification: 'SEARCH',
  displayName: 'List Agent Versions',
  description: 'Lists the stored versions of an agent.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the versions of one voice or chat agent with publish state, title and description, newest first. Use it to pick a version for Publish Agent or to pin a call to a version. Read-only.',
    idempotent: true,
  },
  props: {
    agent_id: retellAiProps.id({ displayName: 'Agent ID', description: 'Voice or chat agent ID.' }),
    limit: retellAiProps.limit(),
    pagination_key: retellAiProps.paginationKey(),
  },
  outputSchema: retellSchemas.agentVersionPage,
  async run({ auth, propsValue }) {
    const response = await retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.GET,
      path: `/list-agent-versions/${retellInput.seg({ value: propsValue.agent_id, label: 'Agent ID' })}`,
      query: {
        limit: retellInput.pageLimit(propsValue.limit),
        sort_order: 'descending',
        pagination_key: retellInput.optionalText(propsValue.pagination_key),
      },
      retryRateLimit: true,
    });
    return retellMap.page({ body: response, mapItem: retellMap.agentVersion });
  },
});
