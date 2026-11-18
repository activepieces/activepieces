import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsCalculateAgentLlmUsageOutputSchema } from '../../output-schemas';

export const calculateLlmUsage = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_calculate_llm_usage',
  outputSchema: elevenlabsCalculateAgentLlmUsageOutputSchema,
  displayName: 'Calculate LLM Usage',
  description: 'Estimate the LLM cost for a prompt and knowledge base size',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Estimates the expected LLM price per minute for a prompt length and knowledge base size across the available LLMs. Read-only despite using POST.',
    idempotent: true,
  },
  props: {
    promptLength: Property.Number({ displayName: 'Prompt Length', description: 'Prompt length in characters', required: true }),
    numberOfPages: Property.Number({ displayName: 'Number Of Pages', description: 'Knowledge base pages', required: true }),
    ragEnabled: Property.StaticDropdown({ displayName: 'Rag Enabled', description: 'Whether RAG is enabled', required: true, options: { options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] } }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.POST,
      path: `/v1/convai/llm-usage/calculate`,
      body: elevenlabsClient.compact({ values: { prompt_length: propsValue.promptLength, number_of_pages: propsValue.numberOfPages, rag_enabled: propsValue.ragEnabled } }),
    });
    return response ?? { success: true };
  },
});
