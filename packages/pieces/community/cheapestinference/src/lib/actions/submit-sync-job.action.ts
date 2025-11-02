import {
  createAction,
  Property,
  DynamicPropsValue,
} from '@activepieces/pieces-framework'
import {
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common'
import { cheapestinferenceAuth } from '../../index'
import { BASE_URL } from '../common'

export const submitSyncJob = createAction({
  name: 'submit_sync_job',
  displayName: 'Real-time AI',
  description: 'Submits a new sync inference job.',
  auth: cheapestinferenceAuth,
  props: {
    // --- Required Fields ---
    model: Property.Dropdown({
      displayName: 'Model ID',
      description: 'The ID of the model to use.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Enter your API key first',
          };
        }
        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${BASE_URL}/models`,
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: auth as string,
            },
          });

          // Assumes the API returns an array of models with 'id' or 'model_id' field
          // Adjust the mapping based on the actual API response structure
          const allModels = Array.isArray(response.body) 
            ? response.body 
            : response.body.data || response.body.models || [];

          // Filter only models with type === "chat"
          const chatModels = allModels.filter((model: any) => model.type === 'chat');

          if (!chatModels || chatModels.length === 0) {
            return {
              disabled: true,
              options: [],
              placeholder: 'No chat models found. Check your API key permissions.',
            };
          }

          return {
            disabled: false,
            options: chatModels.map((model: any) => {
              const modelId = model.id || model.model_id || model.name || model;
              const modelLabel = model.name || model.display_name || modelId;
              return {
                label: modelLabel,
                value: modelId,
              };
            }),
          };
        } catch (error: any) {
          const errorMessage = error?.response?.body?.message || 
                               error?.message || 
                               error?.body?.message ||
                               'Unknown error occurred';
          const statusCode = error?.response?.status || error?.status;
          
          return {
            disabled: true,
            options: [],
            placeholder: statusCode === 401 || statusCode === 403 
              ? `Authentication failed: ${errorMessage}` 
              : statusCode === 404
              ? `Endpoint not found. Check if /models endpoint exists.`
              : `Error loading models (${statusCode || 'unknown'}): ${errorMessage}`,
          };
        }
      },
    }),
    messages: Property.Json({
      displayName: 'Messages',
      description: 'The messages to send to the model.',
      required: true,
      defaultValue: {
        messages: [
          {
            role: 'user',
            content: 'Hello, how are you?',
          },
        ],
      },
    })
    ,
    // --- Advanced Parameters (Optional) ---
    show_advanced: Property.Checkbox({
      displayName: 'Show Advanced Parameters',
      description: 'Enable this to configure advanced model parameters.',
      required: false,
      defaultValue: false,
    }),
    advanced_params: Property.DynamicProperties({
      displayName: '',
      description: '',
      required: false,
      refreshers: ['show_advanced'],
      props: async ({ show_advanced }) => {
        if (!show_advanced) {
          return {};
        }

        const props: DynamicPropsValue = {};
        
        props['max_tokens'] = Property.Number({
          displayName: 'Max Tokens',
          description: 'The maximum number of tokens to generate.',
          required: false,
        });
        
        props['stop'] = Property.Array({
          displayName: 'Stop',
          description: 'A list of string sequences that will truncate (stop) inference text output. For example, "</s>" will stop generation as soon as the model generates the given token.',
          required: false,
        });
        
        props['temperature'] = Property.Number({
          displayName: 'Temperature',
          description: 'A decimal number from 0-1 that determines the degree of randomness in the response. A temperature less than 1 favors more correctness and is appropriate for question answering or summarization. A value closer to 1 introduces more randomness in the output.',
          required: false,
        });
        
        props['top_p'] = Property.Number({
          displayName: 'Top P',
          description: 'A percentage (also called the nucleus parameter) that\'s used to dynamically adjust the number of choices for each predicted token based on the cumulative probabilities. It specifies a probability threshold below which all less likely tokens are filtered out. This technique helps maintain diversity and generate more fluent and natural-sounding text.',
          required: false,
        });
        
        props['top_k'] = Property.Number({
          displayName: 'Top K',
          description: 'An integer that\'s used to limit the number of choices for the next predicted word or token. It specifies the maximum number of tokens to consider at each step, based on their probability of occurrence. This technique helps to speed up the generation process and can improve the quality of the generated text by focusing on the most likely options.',
          required: false,
        });
        
        props['context_length_exceeded_behavior'] = Property.StaticDropdown({
          displayName: 'Context Length Exceeded Behavior',
          description: 'Defined the behavior of the API when max_tokens exceed the maximum context length of the model. When set to \'error\', API will return 400 with appropriate error message. When set to \'truncate\', override the max_tokens with maximum context length of the model.',
          required: false,
          options: {
            disabled: false,
            options: [
              { label: 'Error', value: 'error' },
              { label: 'Truncate', value: 'truncate' },
            ],
          },
          defaultValue: 'error',
        });
        
        props['repetition_penalty'] = Property.Number({
          displayName: 'Repetition Penalty',
          description: 'A number that controls the diversity of generated text by reducing the likelihood of repeated sequences. Higher values decrease repetition.',
          required: false,
        });
        
        props['stream'] = Property.Checkbox({
          displayName: 'Stream',
          description: 'If true, stream tokens as Server-Sent Events as the model generates them instead of waiting for the full model response. The stream terminates with data: [DONE]. If false, return a single JSON object containing the results.',
          required: false,
          defaultValue: false,
        });
        
        props['logprobs'] = Property.Number({
          displayName: 'Logprobs',
          description: 'An integer between 0 and 20 of the top k tokens to return log probabilities for at each generation step, instead of just the sampled token. Log probabilities help assess model confidence in token predictions.',
          required: false,
        });
        
        props['echo'] = Property.Checkbox({
          displayName: 'Echo',
          description: 'If true, the response will contain the prompt. Can be used with logprobs to return prompt logprobs.',
          required: false,
          defaultValue: false,
        });
        
        props['n'] = Property.Number({
          displayName: 'N',
          description: 'The number of completions to generate for each prompt.',
          required: false,
        });
        
        props['min_p'] = Property.Number({
          displayName: 'Min P',
          description: 'A number between 0 and 1 that can be used as an alternative to top_p and top-k.',
          required: false,
        });
        
        props['presence_penalty'] = Property.Number({
          displayName: 'Presence Penalty',
          description: 'A number between -2.0 and 2.0 where a positive value increases the likelihood of a model talking about new topics.',
          required: false,
        });
        
        props['frequency_penalty'] = Property.Number({
          displayName: 'Frequency Penalty',
          description: 'A number between -2.0 and 2.0 where a positive value decreases the likelihood of repeating tokens that have already been mentioned.',
          required: false,
        });
        
        props['logit_bias'] = Property.Json({
          displayName: 'Logit Bias',
          description: 'Adjusts the likelihood of specific tokens appearing in the generated output. Example: { "105": 21.4, "1024": -10.5 }',
          required: false,
        });
        
        props['seed'] = Property.Number({
          displayName: 'Seed',
          description: 'Seed value for reproducibility.',
          required: false,
        });
        
        props['function_call'] = Property.StaticDropdown({
          displayName: 'Function Call',
          description: 'Controls which (if any) function is called by the model.',
          required: false,
          options: {
            disabled: false,
            options: [
              { label: 'None', value: 'none' },
              { label: 'Auto', value: 'auto' },
            ],
          },
        });
        
        props['response_format'] = Property.Json({
          displayName: 'Response Format',
          description: 'An object specifying the format that the model must output.',
          required: false,
        });
        
        props['tools'] = Property.Array({
          displayName: 'Tools',
          description: 'A list of tools the model may call. Currently, only functions are supported as a tool. Use this to provide a list of functions the model may generate JSON inputs for.',
          required: false,
        });
        
        props['tool_choice'] = Property.ShortText({
          displayName: 'Tool Choice',
          description: 'Controls which (if any) function is called by the model. By default uses auto, which lets the model pick between generating a message or calling a function.',
          required: false,
        });
        
        props['safety_model'] = Property.ShortText({
          displayName: 'Safety Model',
          description: 'The name of the moderation model used to validate tokens. Choose from the available moderation models found here.',
          required: false,
        });
        
        props['reasoning_effort'] = Property.StaticDropdown({
          displayName: 'Reasoning Effort',
          description: 'Controls the level of reasoning effort the model should apply when generating responses. Higher values may result in more thoughtful and detailed responses but may take longer to generate.',
          required: false,
          options: {
            disabled: false,
            options: [
              { label: 'Low', value: 'low' },
              { label: 'Medium', value: 'medium' },
              { label: 'High', value: 'high' },
            ],
          },
        });
        
        return props;
      },
    }),
  },
  async run(context) {
    const { 
      model, 
      messages, 
      advanced_params,
    } = context.propsValue
    const apiKey = context.auth // API Key from the user's Connection

    // Construct the payload based on API docs
    // Extract messages array from the messages property
    // messages can be either an array directly or an object with a messages property
    const messagesData = messages as any;
    let messagesArray: Array<{ role: string; content: string }> = [];
    
    if (Array.isArray(messagesData)) {
      // If messages is already an array
      messagesArray = messagesData;
    } else if (messagesData && Array.isArray(messagesData.messages)) {
      // If messages is an object with a messages property containing an array
      messagesArray = messagesData.messages;
    } else {
      // Fallback: try to extract from the object
      messagesArray = messagesData as Array<{ role: string; content: string }>;
    }
    
    // Build request body with messages array
    const requestBody: Record<string, unknown> = {
      model: model,
      messages: messagesArray,
    };
    
    // Add optional parameters from advanced_params if provided
    // These are body params and go at the root level of the request body
    if (advanced_params) {
      const params = advanced_params as Record<string, unknown>;
      
      // Add all advanced parameters if they are provided
      const advancedParamKeys = [
        'max_tokens',
        'stop',
        'temperature',
        'top_p',
        'top_k',
        'context_length_exceeded_behavior',
        'repetition_penalty',
        'stream',
        'logprobs',
        'echo',
        'n',
        'min_p',
        'presence_penalty',
        'frequency_penalty',
        'logit_bias',
        'seed',
        'function_call',
        'response_format',
        'tools',
        'tool_choice',
        'safety_model',
        'reasoning_effort',
      ];
      
      for (const key of advancedParamKeys) {
        if (params[key] !== undefined && params[key] !== null) {
          requestBody[key] = params[key];
        }
      }
    }
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/chat/completions`,
      headers: {
        'Content-Type': 'application/json',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: apiKey,
      },
      body: requestBody,
    })

    // Return the response from your API (e.g., job_id, status: "pending")
    // This will be visible to the user as the output of this step.
    return response.body
  },
})


