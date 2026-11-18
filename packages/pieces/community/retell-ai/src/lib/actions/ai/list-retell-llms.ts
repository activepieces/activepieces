import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
export const listRetellLlmsAction = createAction({
  auth: retellAiAuth,
  name: 'list_retell_llms',
  classification: 'SEARCH',
  displayName: 'List Retell LLMs',
  description: 'Lists Retell LLM response engines.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the Retell LLM response engines (prompt + model configs that agents use) with model, prompt and begin message. An agent links to one via llm_id. Pass pagination_key for the next page. Read-only.',
    idempotent: true,
  },
  props: {
    limit: retellAiProps.limit(),
    pagination_key: retellAiProps.paginationKey(),
  },
  outputSchema: retellSchemas.llmPage,
  async run({ auth, propsValue }) {
    const response = await retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.GET,
      path: '/v2/list-retell-llms',
      query: {
        limit: retellInput.pageLimit(propsValue.limit),
        pagination_key: retellInput.optionalText(propsValue.pagination_key),
      },
      retryRateLimit: true,
    });
    return retellMap.page({ body: response, mapItem: retellMap.retellLlm });
  },
});
