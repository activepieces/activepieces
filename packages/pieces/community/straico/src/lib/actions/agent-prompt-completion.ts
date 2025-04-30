import { straicoAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { baseUrlv0 } from '../common/common';

export const agentPromptCompletion = createAction({
  auth: straicoAuth,
  name: 'agent_prompt_completion',
  displayName: 'Agent Prompt Completion',
  description: 'Prompt an agent with a message and get a response',
  props: {
    agentId: Property.Dropdown({
      displayName: 'Agent',
      required: true,
      description: 'Select the agent to prompt',
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first',
            options: [],
          };
        }

        const response = await httpClient.sendRequest<{
          success: boolean;
          data: Array<{
            _id: string;
            name: string;
          }>;
        }>({
          url: `${baseUrlv0}/agent`,
          method: HttpMethod.GET,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth as string,
          },
        });

        if (response.body.success && response.body.data) {
          return {
            options: response.body.data.map((agent) => {
              return {
                label: agent.name,
                value: agent._id,
              };
            }),
          };
        }

        return {
          disabled: true,
          placeholder: 'No agents found',
          options: [],
        };
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
      description: 'The text prompt for the agent',
    }),
    searchType: Property.Dropdown({
      displayName: 'Search Type',
      required: false,
      description: 'The search type to use for RAG model',
      refreshers: [],
      options: async () => {
        return {
          options: [
            { label: 'Similarity', value: 'similarity' },
            { label: 'MMR', value: 'mmr' },
            { label: 'Similarity Score Threshold', value: 'similarity_score_threshold' },
          ],
        };
      },
    }),
    k: Property.Number({
      displayName: 'Number of Documents',
      required: false,
      description: 'Number of documents to return',
    }),
    fetchK: Property.Number({
      displayName: 'Fetch K',
      required: false,
      description: 'Amount of documents to pass to MMR algorithm',
    }),
    lambdaMult: Property.Number({
      displayName: 'Lambda Mult',
      required: false,
      description: 'Diversity of results returned by MMR (0 for minimum, 1 for maximum)',
    }),
    scoreThreshold: Property.Number({
      displayName: 'Score Threshold',
      required: false,
      description: 'Minimum relevance threshold for similarity_score_threshold',
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
        token: auth as string,
      },
    });

    return response.body.data;
  },
});
