import {
  createAction,
  Property,
  StoreScope,
} from '@activepieces/pieces-framework';
import {
  propsValidation,
} from '@activepieces/pieces-common';
import { grokAuth } from '../common/auth';
import { 
  createModelProperty, 
  createTemperatureProperty,
  createTokenProperty,
  createSearchProperties,
  createAdvancedProperties,
  makeXaiRequest,
  validateResponse,
  parseJsonResponse,
  buildSearchParameters,
  shouldUseReasoningEffort,
  XaiResponse,
  AskGrokResult
} from '../common/utils';
import { z } from 'zod';

export const askGrok = createAction({
  auth: grokAuth,
  name: 'ask_grok',
  displayName: 'Ask Grok (Send Prompt)',
  description: 'Send a text prompt or image URL to Grok with advanced features like real-time search, tools, and structured outputs.',
  props: {
    model: createModelProperty({
      displayName: 'Model',
      description: 'The Grok model to use for generating the response.',
      defaultValue: 'grok-3-beta'
    }),
    messages: Property.Array({
      displayName: 'Messages',
      required: true,
      description: 'The conversation messages. Use this for complex multi-turn conversations.',
      properties: {
        role: Property.StaticDropdown({
          displayName: 'Role',
          required: true,
          options: {
            disabled: false,
            options: [
              { label: 'System', value: 'system' },
              { label: 'User', value: 'user' },
              { label: 'Assistant', value: 'assistant' },
              { label: 'Tool', value: 'tool' },
            ],
          },
        }),
        content: Property.LongText({
          displayName: 'Content',
          required: true,
          description: 'The message content (text, image URL, or JSON for multimodal).',
        }),
        name: Property.ShortText({
          displayName: 'Name (Optional)',
          required: false,
          description: 'Unique identifier for the user/assistant.',
        }),
        tool_call_id: Property.ShortText({
          displayName: 'Tool Call ID (for tool role)',
          required: false,
          description: 'Required when role is "tool" - ID from the tool call.',
        }),
      },
    }),
    quickPrompt: Property.LongText({
      displayName: 'Quick Prompt (Alternative)',
      required: false,
      description: 'Simple text prompt for single-turn conversations. Ignored if Messages is provided.',
    }),
    systemMessage: Property.LongText({
      displayName: 'System Instructions',
      required: false,
      description: 'System message to set behavior and context for Grok.',
      defaultValue: 'You are Grok, a helpful and witty AI assistant that provides accurate, truthful answers.',
    }),
    imageUrl: Property.ShortText({
      displayName: 'Image URL (Optional)',
      required: false,
      description: 'Image URL for vision models. Works with quick prompt mode.',
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description: 'Controls randomness (0-2): 0 = deterministic, 2 = very creative.',
      defaultValue: 1.0,
    }),
    maxCompletionTokens: Property.Number({
      displayName: 'Max Completion Tokens',
      required: false,
      description: 'Maximum tokens to generate (includes reasoning tokens).',
    }),
    topP: Property.Number({
      displayName: 'Top P',
      required: false,
      description: 'Nucleus sampling (0-1): 0.1 = top 10% probability mass.',
      defaultValue: 1.0,
    }),
    frequencyPenalty: Property.Number({
      displayName: 'Frequency Penalty',
      required: false,
      description: 'Reduces repetition (-2.0 to 2.0).',
      defaultValue: 0,
    }),
    presencePenalty: Property.Number({
      displayName: 'Presence Penalty',
      required: false,
      description: 'Encourages new topics (-2.0 to 2.0).',
      defaultValue: 0,
    }),
    responseFormat: Property.StaticDropdown({
      displayName: 'Response Format',
      required: false,
      defaultValue: 'text',
      description: 'Output format for the response.',
      options: {
        disabled: false,
        options: [
          { label: 'Text', value: 'text' },
          { label: 'JSON Object', value: 'json_object' },
          { label: 'JSON Schema', value: 'json_schema' },
        ],
      },
    }),
    jsonSchema: Property.LongText({
      displayName: 'JSON Schema',
      required: false,
      description: 'JSON schema for structured output (when response format is json_schema).',
    }),
    enableRealTimeSearch: Property.Checkbox({
      displayName: 'Enable Real-Time Search',
      required: false,
      defaultValue: false,
      description: 'Allow Grok to search the web and X for current information.',
    }),
    searchMode: Property.StaticDropdown({
      displayName: 'Search Mode',
      required: false,
      defaultValue: 'auto',
      description: 'How to handle real-time data search.',
      options: {
        disabled: false,
        options: [
          { label: 'Auto (Model decides)', value: 'auto' },
          { label: 'Always Search', value: 'on' },
          { label: 'Never Search', value: 'off' },
        ],
      },
    }),
    maxSearchResults: Property.Number({
      displayName: 'Max Search Results',
      required: false,
      defaultValue: 15,
      description: 'Maximum number of search results to use (1-30).',
    }),
         searchSources: Property.MultiSelectDropdown({
       displayName: 'Search Sources',
       required: false,
       description: 'Sources to search in.',
       refreshers: [],
       options: async () => ({
         disabled: false,
         options: [
           { label: 'Web', value: 'web' },
           { label: 'News', value: 'news' },
           { label: 'X (Twitter)', value: 'x' },
         ],
       }),
     }),
    tools: Property.Array({
      displayName: 'Tools/Functions',
      required: false,
      description: 'Functions the model can call.',
      properties: {
        name: Property.ShortText({
          displayName: 'Function Name',
          required: true,
          description: 'Name of the function.',
        }),
        description: Property.LongText({
          displayName: 'Description',
          required: false,
          description: 'What the function does.',
        }),
        parameters: Property.LongText({
          displayName: 'Parameters Schema',
          required: true,
          description: 'JSON schema defining function parameters.',
        }),
      },
    }),
    toolChoice: Property.StaticDropdown({
      displayName: 'Tool Choice',
      required: false,
      defaultValue: 'auto',
      description: 'How the model should use tools.',
      options: {
        disabled: false,
        options: [
          { label: 'Auto (Model decides)', value: 'auto' },
          { label: 'None (No tools)', value: 'none' },
          { label: 'Required (Must use tool)', value: 'required' },
        ],
      },
    }),
    reasoningEffort: Property.StaticDropdown({
      displayName: 'Reasoning Effort',
      required: false,
      description: 'How hard reasoning models should think (not for grok-4).',
      options: {
        disabled: false,
        options: [
          { label: 'Default', value: '' },
          { label: 'Low (Fewer tokens)', value: 'low' },
          { label: 'High (More tokens)', value: 'high' },
        ],
      },
    }),
    stopSequences: Property.ShortText({
      displayName: 'Stop Sequences',
      required: false,
      description: 'Comma-separated sequences to stop generation.',
    }),
    numberOfChoices: Property.Number({
      displayName: 'Number of Choices',
      required: false,
      defaultValue: 1,
      description: 'How many response choices to generate (increases cost).',
    }),
    logprobs: Property.Checkbox({
      displayName: 'Include Log Probabilities',
      required: false,
      defaultValue: false,
      description: 'Include token probability information.',
    }),
    topLogprobs: Property.Number({
      displayName: 'Top Log Probs',
      required: false,
      description: 'Number of top token probabilities to return (0-8).',
    }),
    seed: Property.Number({
      displayName: 'Seed',
      required: false,
      description: 'Random seed for deterministic outputs.',
    }),
    stream: Property.Checkbox({
      displayName: 'Enable Streaming',
      required: false,
      defaultValue: false,
      description: 'Stream response as it generates (not recommended for automation).',
    }),
    user: Property.ShortText({
      displayName: 'User ID',
      required: false,
      description: 'Unique identifier for end-user (helps monitor abuse).',
    }),
    memoryKey: Property.ShortText({
      displayName: 'Memory Key',
      description: 'Keep conversation history across runs.',
      required: false,
    }),
    includeUsageStats: Property.Checkbox({
      displayName: 'Include Usage Statistics',
      required: false,
      defaultValue: true,
      description: 'Include detailed token usage information.',
    }),
    includeCitations: Property.Checkbox({
      displayName: 'Include Citations',
      required: false,
      defaultValue: true,
      description: 'Include sources used by the model.',
    }),
    includeDebugOutput: Property.Checkbox({
      displayName: 'Include Debug Output',
      required: false,
      defaultValue: false,
      description: 'Include debug information (for trusted testers).',
    }),
  },
  async run({ auth, propsValue, store }) {
    await propsValidation.validateZod(propsValue, {
      temperature: z.number().min(0).max(2).optional(),
      topP: z.number().min(0).max(1).optional(),
      maxCompletionTokens: z.number().min(1).optional(),
      frequencyPenalty: z.number().min(-2).max(2).optional(),
      presencePenalty: z.number().min(-2).max(2).optional(),
      maxSearchResults: z.number().min(1).max(30).optional(),
      numberOfChoices: z.number().min(1).optional(),
      topLogprobs: z.number().min(0).max(8).optional(),
      memoryKey: z.string().max(128).optional(),
    });

    const {
      model,
      messages,
      quickPrompt,
      systemMessage,
      imageUrl,
      temperature,
      maxCompletionTokens,
      topP,
      frequencyPenalty,
      presencePenalty,
      responseFormat,
      jsonSchema,
      enableRealTimeSearch,
      searchMode,
      maxSearchResults,
      searchSources,
      tools,
      toolChoice,
      reasoningEffort,
      stopSequences,
      numberOfChoices,
      logprobs,
      topLogprobs,
      seed,
      stream,
      user,
      memoryKey,
      includeUsageStats,
      includeCitations,
      includeDebugOutput,
    } = propsValue;

    let conversationMessages: any[] = [];

    if (messages && Array.isArray(messages) && messages.length > 0) {
      conversationMessages = messages.map((msg: any) => {
        const message: any = {
          role: msg.role,
          content: msg.content,
        };
        if (msg.name) message.name = msg.name;
        if (msg.tool_call_id && msg.role === 'tool') message.tool_call_id = msg.tool_call_id;
        return message;
      });
    } else if (quickPrompt) {
      if (systemMessage) {
        conversationMessages.push({
          role: 'system',
          content: systemMessage,
        });
      }

      if (imageUrl) {
        conversationMessages.push({
          role: 'user',
          content: [
            { type: 'text', text: quickPrompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        });
      } else {
        conversationMessages.push({
          role: 'user',
          content: quickPrompt,
        });
      }
    } else {
      throw new Error('Either provide Messages array or Quick Prompt');
    }

    let messageHistory: any[] = [];
    if (memoryKey) {
      messageHistory = (await store.get(memoryKey, StoreScope.PROJECT)) ?? [];
      if (messageHistory.length > 0) {
        conversationMessages = [...messageHistory, ...conversationMessages];
      }
    }

    const requestBody: any = {
      model,
      messages: conversationMessages,
    };

    if (temperature !== undefined) requestBody.temperature = temperature;
    if (maxCompletionTokens !== undefined) requestBody.max_completion_tokens = maxCompletionTokens;
    if (topP !== undefined) requestBody.top_p = topP;
    if (frequencyPenalty !== undefined) requestBody.frequency_penalty = frequencyPenalty;
    if (presencePenalty !== undefined) requestBody.presence_penalty = presencePenalty;
    if (numberOfChoices !== undefined) requestBody.n = numberOfChoices;
    if (logprobs !== undefined) requestBody.logprobs = logprobs;
    if (topLogprobs !== undefined) requestBody.top_logprobs = topLogprobs;
    if (seed !== undefined) requestBody.seed = seed;
    if (stream !== undefined) requestBody.stream = stream;
    if (user) requestBody.user = user;

    if (responseFormat && responseFormat !== 'text') {
      if (responseFormat === 'json_object') {
        requestBody.response_format = { type: 'json_object' };
      } else if (responseFormat === 'json_schema' && jsonSchema) {
        try {
          const schema = JSON.parse(jsonSchema);
          requestBody.response_format = {
            type: 'json_schema',
            json_schema: schema,
          };
        } catch (error) {
          throw new Error('Invalid JSON schema provided');
        }
      }
    }

    if (enableRealTimeSearch) {
      const searchParams: any = {
        mode: searchMode || 'auto',
        max_search_results: maxSearchResults || 15,
        return_citations: includeCitations,
      };

      if (searchSources && Array.isArray(searchSources) && searchSources.length > 0) {
        searchParams.sources = searchSources.map((source: string) => ({ type: source }));
      }

      requestBody.search_parameters = searchParams;
    }

    if (tools && Array.isArray(tools) && tools.length > 0) {
      requestBody.tools = tools.map((tool: any) => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description || '',
          parameters: JSON.parse(tool.parameters),
        },
      }));

      if (toolChoice && toolChoice !== 'auto') {
        requestBody.tool_choice = toolChoice;
      }
    }

    if (reasoningEffort && !model.includes('grok-3')) {
      requestBody.reasoning_effort = reasoningEffort;
    }

    if (stopSequences) {
      const stops = stopSequences.split(',').map(s => s.trim()).filter(s => s.length > 0);
      if (stops.length > 0) {
        requestBody.stop = stops.slice(0, 4);
      }
    }

    try {
      const response = await makeXaiRequest(auth, requestBody, 180000, 'Ask Grok');
      const choice = response.body.choices[0];
      const assistantMessage = choice.message;

      if (memoryKey) {
        const newHistory = [
          ...messageHistory,
          ...conversationMessages.slice(messageHistory.length),
          assistantMessage,
        ];
        const trimmedHistory = newHistory.slice(-30);
        await store.put(memoryKey, trimmedHistory, StoreScope.PROJECT);
      }

      const result = {
        content: assistantMessage.content,
        reasoning_content: assistantMessage.reasoning_content,
        refusal: assistantMessage.refusal,
        role: assistantMessage.role,
        finish_reason: choice.finish_reason,
        index: choice.index,
        model: response.body.model,
        id: response.body.id,
        created: response.body.created,
        object: response.body.object,
        system_fingerprint: response.body.system_fingerprint,
      };

      if (assistantMessage.tool_calls) {
        (result as any).tool_calls = assistantMessage.tool_calls;
      }

      if (choice.logprobs) {
        (result as any).logprobs = choice.logprobs;
      }

      if (numberOfChoices && numberOfChoices > 1) {
        (result as any).all_choices = response.body.choices;
      }

      if (includeUsageStats && response.body.usage) {
        (result as any).usage = response.body.usage;
      }

      if (includeCitations && response.body.citations) {
        (result as any).citations = response.body.citations;
      }

      if (includeDebugOutput && response.body.debug_output) {
        (result as any).debug_output = response.body.debug_output;
      }

      return result as AskGrokResult;
    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorMessage = error.response?.body?.error?.message || 'Bad request';
        throw new Error(`Chat completion failed: ${errorMessage}`);
      }
      
      if (error.response?.status === 422) {
        const errorMessage = error.response?.body?.error?.message || 'Validation error';
        throw new Error(`Invalid parameters: ${errorMessage}`);
      }

      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      if (error.response?.status === 500) {
        throw new Error('Chat service temporarily unavailable. Please try again.');
      }

      if (error.response?.status === 401) {
        throw new Error('Invalid API key. Please check your xAI API key.');
      }

      if (error.response?.status === 403) {
        throw new Error('Access denied. Please check your API key permissions.');
      }

      if (error.message?.includes('timeout')) {
        throw new Error('Request timed out. Try reducing context length or search results.');
      }

      throw new Error(`Chat completion failed: ${error.message || 'Unknown error occurred'}`);
    }
  },
});