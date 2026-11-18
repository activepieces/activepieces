import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsCalculateAgentLlmUsageOutputSchema } from '../../output-schemas';

export const calculateAgentLlmUsage = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_calculate_agent_llm_usage',
  outputSchema: elevenlabsCalculateAgentLlmUsageOutputSchema,
  displayName: 'Calculate Agent LLM Usage',
  description: 'Estimate the LLM cost of an agent',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Estimates the expected LLM price per minute for an agent across the available LLMs. Read-only despite using POST.',
    idempotent: true,
  },
  props: {
    agentId: Property.ShortText({ displayName: 'Agent ID', description: 'The agent_id from List Agents or Create Agent', required: true }),
    promptLength: Property.Number({ displayName: 'Prompt Length', description: 'Prompt length in characters, defaults to the agent prompt', required: false }),
    numberOfPages: Property.Number({ displayName: 'Number Of Pages', description: 'Knowledge base pages, defaults to the agent knowledge base', required: false }),
    ragEnabled: Property.StaticDropdown({ displayName: 'Rag Enabled', description: 'Whether RAG is enabled', required: false, options: { options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] } }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.POST,
      path: `/v1/convai/agent/${encodeURIComponent(propsValue.agentId)}/llm-usage/calculate`,
      body: elevenlabsClient.compact({ values: { prompt_length: propsValue.promptLength, number_of_pages: propsValue.numberOfPages, rag_enabled: propsValue.ragEnabled } }),
    });
    return response ?? { success: true };
  },
});
