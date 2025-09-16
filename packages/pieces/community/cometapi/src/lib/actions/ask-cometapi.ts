import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
  propsValidation,
} from '@activepieces/pieces-common';
import { cometApiAuth } from '../common/auth';
import { z } from 'zod';
import { modelIdDropdown } from '../common/props';

interface CometApiChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const askCometApiAction = createAction({
  name: 'ask-cometapi',
  displayName: 'Ask CometAPI',
  description: 'Sends a prompt to any AI model supported by CometAPI.',
  auth: cometApiAuth,
  props: {
    model: modelIdDropdown,
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
      description: 'The prompt to send to the AI model.',
    }),
    systemMessage: Property.LongText({
      displayName: 'System Message',
      required: false,
      description: 'Optional system message to set the behavior of the AI.',
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description:
        'Controls randomness (0-2). Lower values make output more focused.',
      defaultValue: 1.0,
    }),
    maxTokens: Property.Number({
      displayName: 'Max Tokens',
      required: false,
      description: 'Maximum number of tokens to generate.',
      defaultValue: 1000,
    }),
    topP: Property.Number({
      displayName: 'Top P',
      required: false,
      description: 'Controls diversity via nucleus sampling (0-1).',
      defaultValue: 1.0,
    }),
  },

  async run(context) {
    // Validate input parameters
    await propsValidation.validateZod(context.propsValue, {
      temperature: z.number().min(0).max(2).optional(),
      topP: z.number().min(0).max(1).optional(),
      maxTokens: z.number().positive().optional(),
    });

    const { model, prompt, systemMessage, temperature, maxTokens, topP } =
      context.propsValue;

    // Build messages array
    const messages: ChatMessage[] = [];

    if (systemMessage) {
      messages.push({
        role: 'system',
        content: systemMessage,
      });
    }

    messages.push({
      role: 'user',
      content: prompt,
    });

    // Build request body
    const requestBody: Record<string, unknown> = {
      model: model,
      messages: messages,
    };

    // Add optional parameters
    if (temperature !== undefined) requestBody['temperature'] = temperature;
    if (maxTokens !== undefined) requestBody['max_tokens'] = maxTokens;
    if (topP !== undefined) requestBody['top_p'] = topP;

    // Build request
    const request: HttpRequest = {
      url: 'https://api.cometapi.com/v1/chat/completions',
      method: HttpMethod.POST,
      body: requestBody,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await httpClient.sendRequest<CometApiChatResponse>(
        request
      );

      const responseContent = response.body.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('No response content received from API');
      }

      return {
        response: responseContent.trim(),
        model: response.body.model,
        usage: response.body.usage,
      };
    } catch (error: unknown) {
      // Detailed error handling
      const errorObj = error as {
        response?: { status?: number; body?: { error?: { message?: string } } };
        message?: string;
      };

      if (errorObj.response?.status === 401) {
        throw new Error('Authentication failed: Please check your API key.');
      }

      if (errorObj.response?.status === 429) {
        throw new Error('Rate limit exceeded: Please try again later.');
      }

      if (errorObj.response?.status === 400) {
        const errorMessage =
          errorObj.response?.body?.error?.message || 'Bad request parameters';
        throw new Error(`Request parameter error: ${errorMessage}`);
      }

      if (errorObj.response?.status === 404) {
        throw new Error(`Model not found: ${model}`);
      }

      if (errorObj.response?.status && errorObj.response.status >= 500) {
        throw new Error('Server error: Please try again later.');
      }

      throw new Error(`Request failed: ${errorObj.message || 'Unknown error'}`);
    }
  },
});
