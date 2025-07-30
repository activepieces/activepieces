import { Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { XAI_BASE_URL } from './constants';

export interface XaiChoice {
  index: number;
  message: {
    role: string;
    content: string | null;
    reasoning_content?: string | null;
    refusal?: string | null;
    tool_calls?: any[];
  };
  finish_reason: string | null;
  logprobs?: any;
}

export interface XaiUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_tokens_details?: any;
  completion_tokens_details?: any;
  num_sources_used?: number;
}

export interface XaiResponse {
  body: {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: XaiChoice[];
    usage?: XaiUsage;
    citations?: string[];
    debug_output?: any;
    system_fingerprint?: string | null;
  };
}

export interface AskGrokResult {
  content: string | null;
  reasoning_content?: string | null;
  refusal?: string | null;
  role: string;
  finish_reason: string | null;
  index: number;
  model: string;
  id: string;
  created: number;
  object: string;
  system_fingerprint?: string | null;
  tool_calls?: any[];
  logprobs?: any;
  all_choices?: XaiChoice[];
  usage?: XaiUsage;
  citations?: string[];
  debug_output?: any;
}

export interface CategorizationResult {
  categories: any;
  reasoning: any;
  primary_category: any;
  multiple_categories?: boolean;
  total_categories_assigned: any;
  model: string;
  finish_reason: string | null;
  confidence_scores?: any;
  avg_confidence?: any;
  max_confidence?: any;
  min_confidence?: any;
  usage?: XaiUsage;
  citations?: string[];
  reasoning_content?: string | null;
}

export interface ExtractionResult {
  extracted_data: any;
  extraction_notes: any;
  extraction_success: any;
  fields_extracted: number;
  fields_requested: number;
  completion_rate: number;
  model: string;
  finish_reason: string | null;
  confidence_scores?: any;
  avg_confidence?: any;
  max_confidence?: any;
  min_confidence?: any;
  required_fields_found?: any;
  required_fields_missing?: any;
  usage?: XaiUsage;
  citations?: string[];
  reasoning_content?: string | null;
}

export const createModelProperty = (config?: {
  displayName?: string;
  description?: string;
  defaultValue?: string;
  filterForImages?: boolean;
}) => {
  const {
    displayName = 'Model',
    description = 'The Grok model to use.',
    defaultValue = 'grok-3-beta',
    filterForImages = false,
  } = config || {};

  const fallbackModels = filterForImages 
    ? [{ label: 'grok-2-image-1212', value: 'grok-2-image-1212' }]
    : [
        { label: 'grok-3-beta', value: 'grok-3-beta' },
        { label: 'grok-3-fast-beta', value: 'grok-3-fast-beta' },
        { label: 'grok-3-mini-beta', value: 'grok-3-mini-beta' },
      ];

  return Property.Dropdown({
    displayName,
    required: true,
    description,
    refreshers: [],
    defaultValue,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Enter your API key first',
          options: [],
        };
      }

      try {
        const endpoint = filterForImages 
          ? `${XAI_BASE_URL}/image-generation-models`
          : `${XAI_BASE_URL}/language-models`;

        const response = await httpClient.sendRequest({
          url: endpoint,
          method: HttpMethod.GET,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth as string,
          },
        });
        
        let models = [];
        if (filterForImages) {
          models = response.body.models || [];
        } else {
          models = response.body.models || [];
          models = models.filter((model: any) => 
            model.output_modalities?.includes('text') && 
            !model.output_modalities?.includes('image')
          );
        }
        
        return {
          disabled: false,
          options: models.map((model: any) => ({
            label: model.id,
            value: model.id,
          })),
        };
      } catch (error) {
        try {
          const response = await httpClient.sendRequest({
            url: `${XAI_BASE_URL}/models`,
            method: HttpMethod.GET,
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: auth as string,
            },
          });
          
          let models = response.body.data || [];
          
          if (filterForImages) {
            models = models.filter((model: any) => 
              model.id.includes('image') || model.id.includes('vision')
            );
          }
          
          return {
            disabled: false,
            options: models.map((model: any) => ({
              label: model.id,
              value: model.id,
            })),
          };
        } catch (fallbackError) {
          return {
            disabled: false,
            options: fallbackModels,
            placeholder: "Using fallback models",
          };
        }
      }
    },
  });
};

export const createTemperatureProperty = (defaultValue = 0.7) => 
  Property.Number({
    displayName: 'Temperature',
    required: false,
    description: 'Controls randomness (0-2): 0 = deterministic, 1 = balanced, 2 = creative.',
    defaultValue,
  });

export const createTokenProperty = (defaultValue?: number) => 
  Property.Number({
    displayName: 'Max Completion Tokens',
    required: false,
    description: 'Maximum tokens for the response.',
    defaultValue,
  });

export const createSearchProperties = () => ({
  enableContextSearch: Property.Checkbox({
    displayName: 'Enable Context Search',
    required: false,
    defaultValue: false,
    description: 'Allow the model to search for additional context.',
  }),
  includeCitations: Property.Checkbox({
    displayName: 'Include Citations',
    required: false,
    defaultValue: false,
    description: 'Include sources if context search is enabled.',
  }),
});

export const createAdvancedProperties = () => ({
  reasoningEffort: Property.StaticDropdown({
    displayName: 'Reasoning Effort',
    required: false,
    description: 'How thoroughly the model should analyze.',
    options: {
      disabled: false,
      options: [
        { label: 'Default', value: '' },
        { label: 'Low (Quick)', value: 'low' },
        { label: 'High (Deep)', value: 'high' },
      ],
    },
  }),
  user: Property.ShortText({
    displayName: 'User ID',
    required: false,
    description: 'Unique identifier for tracking.',
  }),
});

const handleXaiError = (error: any, operation: string): never => {
  if (error.response?.status === 400) {
    const errorMessage = error.response?.body?.error?.message || 'Bad request';
    throw new Error(`${operation} failed: ${errorMessage}`);
  }
  
  if (error.response?.status === 422) {
    const errorMessage = error.response?.body?.error?.message || 'Validation error';
    throw new Error(`Invalid ${operation.toLowerCase()} parameters: ${errorMessage}`);
  }

  if (error.response?.status === 429) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  if (error.response?.status === 500) {
    throw new Error(`${operation} service temporarily unavailable. Please try again.`);
  }

  if (error.response?.status === 401) {
    throw new Error('Invalid API key. Please check your xAI API key.');
  }

  if (error.response?.status === 403) {
    throw new Error('Access denied. Please check your API key permissions.');
  }

  if (error.message?.includes('timeout')) {
    throw new Error(`${operation} timed out. Try reducing complexity or text length.`);
  }

  throw new Error(`${operation} failed: ${error.message || 'Unknown error occurred'}`);
};

export const makeXaiRequest = async (
  auth: string,
  requestBody: any,
  timeout: number,
  operation: string
): Promise<XaiResponse> => {
  try {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${XAI_BASE_URL}/chat/completions`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
      body: requestBody,
      timeout,
    });

    if (!response.body.choices || !Array.isArray(response.body.choices) || response.body.choices.length === 0) {
      throw new Error('Invalid response format: no choices returned');
    }

    return response as XaiResponse;
  } catch (error: any) {
    handleXaiError(error, operation);
    throw new Error('This should never be reached');
  }
};

export const validateResponse = (response: XaiResponse, operation: string) => {
  const choice = response.body.choices[0];
  const content = choice.message.content;

  if (!content) {
    throw new Error(`No ${operation.toLowerCase()} result received`);
  }

  return { choice, content };
};

export const parseJsonResponse = (content: string, operation: string) => {
  try {
    return JSON.parse(content);
  } catch (parseError) {
    throw new Error(`Failed to parse ${operation.toLowerCase()} result: ${parseError}`);
  }
}; 