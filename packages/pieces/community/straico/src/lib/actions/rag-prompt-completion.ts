import { straicoAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { baseUrlv0, baseUrlv1 } from '../common/common';

export const ragPromptCompletion = createAction({
  auth: straicoAuth,
  name: 'rag_prompt_completion',
  displayName: 'RAG Prompt Completion',
  description: 'Send a prompt to a specific RAG (Retrieval-Augmented Generation) model.',
  props: {
    ragId: Property.ShortText({
      displayName: 'RAG ID',
      required: true,
      description: 'The ID of the RAG base to query',
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
      description: 'A text prompt for the RAG model',
    }),
    model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      description: 'The specific LLM to be used',
      refreshers: [],
      defaultValue: 'openai/gpt-4o-mini',
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Enter your API key first',
            options: [],
          };
        }
        try {
          const models = await httpClient.sendRequest<{
            data: {
              chat: Array<{
                name: string;
                model: string;
              }>;
            };
          }>({
            url: `${baseUrlv1}/models`,
            method: HttpMethod.GET,
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: auth as string,
            },
          });
          
          const modelOptions = models.body?.data?.chat?.map((model) => {
            return {
              label: model.name,
              value: model.model,
            };
          }) || [];
          
          return {
            disabled: false,
            options: modelOptions,
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: "Couldn't load models, API key is invalid",
          };
        }
      },
    }),
    searchType: Property.StaticDropdown({
      displayName: 'Search Type',
      required: false,
      description: 'Type of search to perform',
      options: {
        options: [
          { label: 'Similarity', value: 'similarity' },
          { label: 'MMR', value: 'mmr' },
          { label: 'Similarity Score Threshold', value: 'similarity_score_threshold' }
        ]
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
      description: 'Diversity of results return by MMR (1 for minimum and 0 for maximum)',
    }),
    scoreThreshold: Property.Number({
      displayName: 'Score Threshold',
      required: false,
      description: 'Minimum relevance threshold for similarity_score_threshold',
    }),
  },
  async run({ auth, propsValue }) {
    const { ragId, prompt, model, searchType, k, fetchK, lambdaMult, scoreThreshold } = propsValue;

    if (!ragId) {
      throw new Error('RAG ID is required');
    }

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const requestBody: Record<string, string | number> = {
      prompt,
      model,
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
        response: Record<string, unknown>;
      };
    }>({
      url: `${baseUrlv0}/rag/${ragId}/prompt`,
      method: HttpMethod.POST,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth as string,
      },
      body: requestBody,
    });

    return response.body;
  },
});
