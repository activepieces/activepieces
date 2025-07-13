import { createAction, Property } from '@activepieces/pieces-framework';
import { mistralAiAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { modelIdDropdown } from '../common/props';

export const createChatCompletion = createAction({
  auth: mistralAiAuth,
  name: 'createChatCompletion',
  displayName: 'Create Chat Completion',
  description: 'Generate conversational text using instructed context and user input.',
  props: {
    model: Property.ShortText({
      displayName: "Model",
      required: true
    }),
    messages: Property.ShortText({
      displayName: "Message",
      description: 'The prompt(s) to generate completions for, encoded as a list of dict with role and content.',
      required: true
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'What sampling temperature to use, between 0.0 and 0.7. Higher values like 0.7 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.',
      required: false,
      defaultValue: 0.3,
    }),
    top_p: Property.Number({
      displayName: 'Top P',
      description: 'Nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.',
      required: false,
      defaultValue: 1,
    }),
    max_tokens: Property.Number({
      displayName: 'Max Tokens',
      description: 'The maximum number of tokens to generate in the completion. The token count of your prompt plus max_tokens cannot exceed the model\'s context length.',
      required: false,
    }),
    stream: Property.Checkbox({
      displayName: 'Stream',
      description: 'Whether to stream back partial progress. If set, tokens will be sent as data-only server-side events as they become available.',
      required: false,
      defaultValue: false,
    }),
    stop: Property.ShortText({
      displayName: 'Stop',
      description: 'Stop generation if this token is detected. Or if one of these tokens is detected when providing an array',
      required: true
    }),
    random_seed: Property.Number({
      displayName: 'Random Seed',
      description: 'The seed to use for random sampling. If set, different calls will generate deterministic results.',
      required: false,
    }),
    presence_penalty: Property.Number({
      displayName: 'Presence Penalty',
      description: 'Presence penalty determines how much the model penalizes the repetition of words or phrases. A higher presence penalty encourages the model to use a wider variety of words and phrases.',
      required: false,
      defaultValue: 0,
    }),
    frequency_penalty: Property.Number({
      displayName: 'Frequency Penalty',
      description: 'Frequency penalty penalizes the repetition of words based on their frequency in the generated text. A higher frequency penalty discourages the model from repeating words that have already appeared frequently.',
      required: false,
      defaultValue: 0,
    }),
    n: Property.Number({
      displayName: 'N',
      description: 'Number of completions to return for each request, input tokens are only billed once.',
      required: false,
      defaultValue: 1,
    }),
    safe_prompt: Property.Checkbox({
      displayName: 'Safe Prompt',
      description: 'Whether to inject a safety prompt before all conversations.',
      required: false,
      defaultValue: false,
    }),
    response_format: Property.Object({
      displayName: 'Response Format',
      description: 'Specify the format of the response',
      required: false,
      defaultValue: {
        type: 'text',
        json_schema: {
          name: '',
          description: '',
          schema: {},
          strict: false,
        },
      },
    }),
    tools: Property.Array({
      displayName: 'Tools',
      description: 'Tools to use for function calling',
      required: false,
      defaultValue: [],
    }),
    tool_choice: Property.StaticDropdown({
      displayName: 'Tool Choice',
      description: 'How to handle tool calls',
      required: false,
      defaultValue: 'auto',
      options: {
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'None', value: 'none' },
          { label: 'Required', value: 'required' },
        ],
      },
    }),
    prediction: Property.Object({
      displayName: 'Prediction',
      description: 'Enable users to specify expected results',
      required: false,
      defaultValue: {
        type: 'content',
        content: '',
      },
    }),
    parallel_tool_calls: Property.Checkbox({
      displayName: 'Parallel Tool Calls',
      description: 'Whether to allow parallel tool calls',
      required: false,
      defaultValue: true,
    }),
    prompt_mode: Property.StaticDropdown({
      displayName: 'Prompt Mode',
      description: 'Allows toggling between the reasoning mode and no system prompt',
      required: false,
      options: {
        options: [
          { label: 'Reasoning', value: 'reasoning' },
          { label: 'None', value: null },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const {
      model,
      temperature,
      stop,
      top_p,
      max_tokens,
      stream,
      random_seed,
      presence_penalty,
      frequency_penalty,
      n,
      safe_prompt,
    } = propsValue;

    const requestBody: any = {
      model,
      messages: [
        {
          role: 'user',
          content: 'Who is the best French painter? Answer in one short sentence.'
        }
      ],
    };

    // Add optional parameters only if they are provided
    if (temperature !== undefined) requestBody.temperature = temperature;
    if (top_p !== undefined) requestBody.top_p = top_p;
    if (max_tokens !== undefined) requestBody.max_tokens = max_tokens;
    if (stream !== undefined) requestBody.stream = stream;
    if (stop !== undefined && stop.length > 0) requestBody.stop = stop;
    if (random_seed !== undefined) requestBody.random_seed = random_seed;
    if (presence_penalty !== undefined) requestBody.presence_penalty = presence_penalty;
    if (frequency_penalty !== undefined) requestBody.frequency_penalty = frequency_penalty;
    if (n !== undefined) requestBody.n = n;
    if (safe_prompt !== undefined) requestBody.safe_prompt = safe_prompt;

    const response = await makeRequest(auth as string, HttpMethod.POST, '/chat/completions', requestBody);

    return response;
  },
});
