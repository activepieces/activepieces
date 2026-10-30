import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
export const getRetellLlmAction = createAction({
  auth: retellAiAuth,
  name: 'get_retell_llm',
  classification: 'READ',
  displayName: 'Get Retell LLM',
  description: 'Returns one Retell LLM response engine.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns one Retell LLM response engine with model, general prompt, begin message and knowledge base IDs. Get an agent's llm_id from Get Agent by ID. Read-only.",
    idempotent: true,
  },
  props: {
    llm_id: retellAiProps.id({ displayName: 'Retell LLM ID', description: 'The llm_id of the response engine.' }),
    version: Property.Number({ displayName: 'Version', description: 'Optional version number. Empty = latest.', required: false }),
  },
  outputSchema: retellSchemas.llm,
  async run({ auth, propsValue }) {
    const llm = await retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.GET,
      path: `/get-retell-llm/${retellInput.seg({ value: propsValue.llm_id, label: 'Retell LLM ID' })}`,
      query: { version: retellInput.optionalInteger({ value: propsValue.version, label: 'Version', min: 0 }) },
      retryRateLimit: true,
    });
    return retellMap.retellLlm(llm);
  },
});
