import { straicoAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { baseUrlv0, baseUrlv1 } from '../common/common';

export const ragPromptCompletion = createAction({
  audience: 'both',
  auth: straicoAuth,
  name: 'rag_prompt_completion',
  displayName: 'RAG Prompt Completion',
  description: "Ask a question answered from a knowledge base's files.",
  aiMetadata: { description: 'Answers a question from the documents indexed in one specific RAG knowledge base, returning the answer together with the source passages it was drawn from, and letting retrieval run as plain similarity, MMR for diversity or a similarity score threshold. Pick it when the reply must come from uploaded documents rather than model memory; prefer Ask AI when no document grounding is needed and Agent Prompt Completion when a saved agent already carries the model, persona and knowledge base. Requires a raw RAG id typed as text plus a prompt and an explicit chat model. Not idempotent: each call spends credits and returns a fresh answer.', idempotent: false },
  propertyGroups: [
    {
      key: 'query',
      display: 'section',
      label: 'Query',
      icon: 'send',
      props: ['ragId', 'model', 'prompt'],
    },
  ],
  props: {
    ragId: Property.ShortText({
      displayName: 'RAG ID',
      required: true,
      description: 'The knowledge base (RAG) ID. Find it with the List RAGs action.',
      placeholder: 'e.g. 66a1f0c2b3d4e5f6a7b8c9d0',
    }),
    prompt: Property.LongText({
      displayName: 'Question',
      required: true,
      description: 'What to ask the knowledge base.',
      placeholder: 'e.g. What is our refund policy?',
    }),
    model: Property.Dropdown({
  auth: straicoAuth,

      displayName: 'Model',
      required: true,
      description: 'The chat model that writes the answer.',
      refreshers: [],
      defaultValue: 'openai/gpt-4o-mini',
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Straico account first',
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
              token: auth.secret_text,
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
      advanced: true,
      description: 'How passages are picked. Empty: Similarity.',
      options: {
        options: [
          { label: 'Similarity', value: 'similarity' },
          { label: 'MMR', value: 'mmr' },
          { label: 'Similarity Score Threshold', value: 'similarity_score_threshold' }
        ]
      },
    }),
    k: Property.Number({
      displayName: 'Number of Passages',
      required: false,
      advanced: true,
      description: 'How many passages to use.',
    }),
    fetchK: Property.Number({
      displayName: 'Fetch K',
      required: false,
      advanced: true,
      description: 'MMR only. Passages considered before picking.',
    }),
    lambdaMult: Property.Number({
      displayName: 'Lambda Mult',
      required: false,
      advanced: true,
      description: 'MMR only. From 0 to 1. Lower gives more varied passages.',
    }),
    scoreThreshold: Property.Number({
      displayName: 'Score Threshold',
      required: false,
      advanced: true,
      description: 'Similarity Score Threshold only. Minimum relevance, 0 to 1.',
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
        token: auth.secret_text,
      },
      body: requestBody,
    });

    return response.body;
  },
});
