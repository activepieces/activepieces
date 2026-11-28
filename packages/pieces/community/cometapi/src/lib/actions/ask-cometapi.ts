import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import * as z from 'zod/mini';
import { cometApiAuth } from '../auth';
import { cometApiClient } from '../common/client';
import { cometApiProps } from '../common/props';
import { askCometApiOutputSchema } from '../output-schemas';
import type {
  CometApiChatMessage,
  CometApiChatResponse,
} from '../common/types';

export const askCometApiAction = createAction({
  audience: 'human',
  name: 'ask-cometapi',
  classification: 'READ',
  displayName: 'Ask CometAPI',
  description: 'Sends a prompt to any AI model supported by CometAPI.',
  aiMetadata: {
    description:
      "Sends a single-turn chat completion (one prompt plus an optional system message, with no multi-turn history) to any model in the CometAPI catalog, which fronts OpenAI, Anthropic, Gemini and other vendors behind one key. Requires a model id chosen from CometAPI's live model list, and accepts temperature, top_p and max tokens as optional sampling controls; pick it when the model should be selectable at runtime rather than fixed to a single vendor, and use this piece's Custom API Call for any other CometAPI endpoint such as image generation or embeddings. Not idempotent: each call runs a fresh generation and consumes tokens.",
    idempotent: false,
  },
  auth: cometApiAuth,
  outputSchema: askCometApiOutputSchema,
  props: {
    model: cometApiProps.model({ required: true }),
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
    await propsValidation.validateZod(context.propsValue, {
      temperature: z.optional(z.number().check(z.minimum(0), z.maximum(2))),
      topP: z.optional(z.number().check(z.minimum(0), z.maximum(1))),
      maxTokens: z.optional(z.number().check(z.positive())),
    });

    const { model, prompt, systemMessage, temperature, maxTokens, topP } =
      context.propsValue;

    const messages: CometApiChatMessage[] = [];

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

    const requestBody: Record<string, unknown> = {
      model: model,
      messages: messages,
    };

    if (temperature !== undefined) requestBody['temperature'] = temperature;
    if (maxTokens !== undefined) requestBody['max_tokens'] = maxTokens;
    if (topP !== undefined) requestBody['top_p'] = topP;

    try {
      const response = await cometApiClient.request<CometApiChatResponse>({
        auth: context.auth,
        method: HttpMethod.POST,
        path: '/chat/completions',
        body: requestBody,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseContent = response.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('No response content received from API');
      }

      return {
        response: responseContent.trim(),
        model: response.model,
        usage: response.usage,
      };
    } catch (error: unknown) {
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
