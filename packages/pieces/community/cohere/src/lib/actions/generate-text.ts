import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import {
  CohereChatRequest,
  CohereChatResponse,
  CohereModelsResponse,
} from '../common/types';
import { cohereAuth } from '../auth';

const COHERE_CHAT_URL = 'https://api.cohere.com/v2/chat';
const COHERE_MODELS_URL = 'https://api.cohere.com/v1/models';
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

function readErrorMessage(body: unknown): string | undefined {
  if (
    typeof body === 'object' &&
    body !== null &&
    'message' in body &&
    typeof body.message === 'string'
  ) {
    return body.message;
  }
  return undefined;
}

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

      const statusCode =
        error instanceof HttpError ? error.response.status : undefined;
      const errorBody =
        error instanceof HttpError ? error.response.body : undefined;
      const isRetryable =
        statusCode === 429 ||
        (statusCode !== undefined && statusCode >= 500);

      if (!isRetryable || attempt === MAX_RETRIES - 1) {
        if (errorBody) {
          throw new Error(
            `Cohere API error (${statusCode}): ${readErrorMessage(errorBody) ?? lastError.message}`,
          );
        }
        throw lastError;
      }

      const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError ?? new Error('Generate text failed after retries');
}

export const generateText = createAction({
  audience: 'both',
  auth: cohereAuth,
  name: 'generate_text',
  classification: 'READ',
  displayName: 'Generate Text',
  description: 'Send a prompt to a Cohere model and get a text reply.',
  aiMetadata: { description: 'Runs a single-turn completion against Cohere\'s v2 Chat API - one user prompt in, one generated message out - with optional model, temperature, and max-token controls. This is the only purpose-built action in the Cohere piece and covers only chat-style generation, not multi-turn conversation history, embeddings, rerank, or classify; use the piece\'s Custom API Call action to reach those Cohere endpoints. Requires a prompt and a chat-capable model name. Not idempotent: each call bills a fresh generation and the wording varies unless temperature is set to 0.', idempotent: false },
  propertyGroups: [
    {
      key: 'settings',
      display: 'section',
      label: 'Settings',
      icon: 'sliders',
      props: ['model', 'temperature', 'maxTokens'],
    },
    {
      key: 'message',
      display: 'section',
      label: 'Message',
      icon: 'text',
      props: ['prompt'],
    },
  ],
  props: {
    prompt: Property.LongText({
      displayName: 'Question',
      description: 'What you want the model to answer or do.',
      placeholder: 'e.g. Summarize this email in three bullet points',
      required: true,
    }),
    model: Property.Dropdown({
      displayName: 'Model',
      description: 'The Cohere model that writes the reply.',
      required: true,
      defaultValue: 'command-a-03-2025',
      auth: cohereAuth,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Cohere API key first',
            options: [],
          };
        }

        try {
          const response = await httpClient.sendRequest<CohereModelsResponse>({
            method: HttpMethod.GET,
            url: COHERE_MODELS_URL,
            headers: {
              Authorization: `Bearer ${auth.secret_text}`,
            },
            queryParams: {
              page_size: '1000',
              endpoint: 'chat',
            },
          });

          const options = response.body.models.map((model) => ({
            label: model.name,
            value: model.name,
          }));

          if (options.length === 0) {
            return {
              disabled: false,
              options: [],
              placeholder: 'No chat models found for this API key.',
            };
          }

          return { disabled: false, options };
        } catch {
          return {
            disabled: true,
            options: [],
            placeholder:
              "Couldn't load models, check your API key or try again.",
          };
        }
      },
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description:
        'From 0 to 1. Lower is more focused, higher is more varied.',
      required: false,
      defaultValue: 0.3,
      width: 'half',
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      description: 'Longest reply in tokens. Empty: model default.',
      required: false,
      width: 'half',
    }),
  },

  async run(context) {
    const { prompt, model, temperature, maxTokens } = context.propsValue;
    const apiKey = context.auth.secret_text;

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

    const generatedText = (response.message?.content ?? []).flatMap((block) => block.type === 'text' ? [block.text] : []).join('');

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
