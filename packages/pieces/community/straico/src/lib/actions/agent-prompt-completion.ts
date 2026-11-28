import { straicoAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { baseUrlv0 } from '../common/common';
import { agentIdDropdown } from '../common/props';

export const agentPromptCompletion = createAction({
  audience: 'both',
  auth: straicoAuth,
  name: 'agent_prompt_completion',
  displayName: 'Agent Prompt Completion',
  description: 'Ask a saved agent a question and get its reply.',
  aiMetadata: { description: 'Runs a prompt against a saved Straico agent, which supplies its own custom system prompt, default LLM and attached RAG base, so no model has to be chosen at call time. Pick this when the persona and knowledge are already configured server-side; prefer RAG Prompt Completion to query a knowledge base directly with an explicit model, or Ask AI for a plain one-off completion with no agent or retrieval. Requires the agent id and a prompt; the retrieval controls (search type similarity, mmr or similarity score threshold, plus k, fetch k, lambda mult and score threshold) only matter when the agent has a RAG attached. Not idempotent: each call spends credits and produces a fresh answer.', idempotent: false },
  propertyGroups: [
    {
      key: 'query',
      display: 'section',
      label: 'Query',
      icon: 'send',
      props: ['agentId', 'prompt'],
    },
  ],
  props: {
    agentId: agentIdDropdown('Agent','The agent to ask.'),
    prompt: Property.LongText({
      displayName: 'Question',
      required: true,
      description: 'What to ask the agent.',
      placeholder: 'e.g. What is our refund policy?',
    }),
    searchType: Property.StaticDropdown({
      displayName: 'Search Type',
      required: false,
      description: "How passages are picked from the agent's knowledge base.",
      advanced: true,
      options:  {
        disabled:false,
          options: [
            { label: 'Similarity', value: 'similarity' },
            { label: 'MMR', value: 'mmr' },
            { label: 'Similarity Score Threshold', value: 'similarity_score_threshold' },
          ],
      
      },
    }),
    k: Property.Number({
      displayName: 'Number of Passages',
      required: false,
      description: 'How many passages to use.',
      advanced: true,
    }),
    fetchK: Property.Number({
      displayName: 'Fetch K',
      required: false,
      description: 'MMR only. Passages considered before picking.',
      advanced: true,
    }),
    lambdaMult: Property.Number({
      displayName: 'Lambda Mult',
      required: false,
      description: 'MMR only. From 0 to 1. Lower gives more varied passages.',
      advanced: true,
    }),
    scoreThreshold: Property.Number({
      displayName: 'Score Threshold',
      required: false,
      description: 'Similarity Score Threshold only. Minimum relevance, 0 to 1.',
      advanced: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { 
      agentId, 
      prompt, 
      searchType, 
      k, 
      fetchK, 
      lambdaMult, 
      scoreThreshold 
    } = propsValue;

    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const requestBody: Record<string, unknown> = {
      prompt,
    };

    const optionalParams = {
      search_type: searchType,
      k,
      fetch_k: fetchK,
      lambda_mult: lambdaMult,
      score_threshold: scoreThreshold
    };

    Object.entries(optionalParams).forEach(([key, value]) => {
      if (value !== undefined) {
        requestBody[key] = value;
      }
    });

    const response = await httpClient.sendRequest<{
      success: boolean;
      data: {
        answer: string;
        references: Array<{
          page_content: string;
          page: number;
        }>;
        file_name: string;
        coins_used: number;
        response: unknown;
      };
    }>({
      url: `${baseUrlv0}/agent/${agentId}/prompt`,
      method: HttpMethod.POST,
      body: requestBody,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text,
      },
    });

    return response.body.data;
  },
});
