import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cohereAuth } from '../../index';
import {
  CohereChatRequest,
  CohereChatResponse,
  CohereErrorResponse,
} from '../common/types';

const COHERE_CHAT_URL = 'https://api.cohere.com/v2/chat';
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

async function generateWithRetry(
  apiKey: string,
  request: CohereChatRequest,
): Promise<CohereChatResponse> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await httpClient.sendRequest<CohereChatResponse>({
        method: HttpMethod.POST,
        url: COHERE_CHAT_URL,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: request,
      });

      return response.body;
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const errorAny = error as { response?: { status: number; body: unknown } };
      const statusCode = errorAny.response?.status;
      const isRetryable =
        statusCode === 429 ||
        (statusCode !== undefined && statusCode >= 500);

      if (!isRetryable || attempt === MAX_RETRIES - 1) {
        if (errorAny.response?.body) {
          const errorBody = errorAny.response.body as CohereErrorResponse;
          throw new Error(
            `Cohere API error (${statusCode}): ${errorBody.message ?? lastError.message}`,
          );
        }
        throw lastError;
      }

      const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
      console.log(
        `[Cohere] Retrying in ${backoffMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`,
      );
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError ?? new Error('Generate text failed after retries');
}

export const generateText = createAction({
  auth: cohereAuth,
  name: 'generate_text',
  displayName: 'Generate Text',
  description: 'Generate a text response using Cohere AI Chat API',
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'The user message to send to the model',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'The Cohere model to use for generation',
      required: true,
      defaultValue: 'command-a-03-2025',
      options: {
        disabled: false,
        options: [
          { label: 'Command A (03-2025)', value: 'command-a-03-2025' },
          {
            label: 'Command R+ (08-2024)',
            value: 'command-r-plus-08-2024',
          },
          { label: 'Command R (08-2024)', value: 'command-r-08-2024' },
          { label: 'Command R7B (12-2024)', value: 'command-r7b-12-2024' },
        ],
      },
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description:
        'Controls randomness (0.0 = deterministic, 1.0 = maximum randomness). Default: 0.3',
      required: false,
      defaultValue: 0.3,
    }),
    maxTokens: Property.Number({
      displayName: 'Max Tokens',
      description:
        'Maximum number of tokens to generate. Leave empty for model default.',
      required: false,
    }),
  },

  async run(context) {
    const { prompt, model, temperature, maxTokens } = context.propsValue;
    const apiKey = context.auth.secret_text;

    console.log(
      `[Cohere] Generating text with model: ${model}, prompt length: ${prompt.length}`,
    );

    const request: CohereChatRequest = {
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    };

    if (temperature !== undefined && temperature !== null) {
      request.temperature = temperature;
    }

    if (maxTokens !== undefined && maxTokens !== null) {
      request.max_tokens = maxTokens;
    }

    const response = await generateWithRetry(apiKey, request);

    const generatedText =
      response.message?.content?.[0]?.text ?? '';

    console.log(
      `[Cohere] Generated ${generatedText.length} chars, finish_reason: ${response.finish_reason}`,
    );

    return {
      text: generatedText,
      model,
      finishReason: response.finish_reason,
      usage: {
        inputTokens: response.usage?.billed_units?.input_tokens ?? 0,
        outputTokens: response.usage?.billed_units?.output_tokens ?? 0,
      },
    };
  },
});
