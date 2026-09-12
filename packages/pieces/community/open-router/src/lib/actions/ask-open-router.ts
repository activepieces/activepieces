import { openRouterAuth } from '../auth';
import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { openRouterModels, promptResponse } from '../common';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';
import { askLmmActionOutputSchema } from '../output-schemas';

export const askOpenRouterAction = createAction({
  audience: 'both',
  name: 'ask-lmm',
  classification: 'READ',
  displayName: 'Ask LLM',
  description: 'Send a prompt to any model on OpenRouter and get the reply.',
  aiMetadata: { description: 'Sends a single prompt to any model in the OpenRouter catalog through one unified completions endpoint and returns the generated text, with optional temperature, top-p, and max-token controls. It is the only first-class action in the piece and is single-turn - no conversation memory, no system-role array, and no image or audio input - so use the sibling Custom API Call for any other OpenRouter endpoint, and prefer a vendor-specific piece such as OpenAI, Anthropic, or Groq when the model must come from one provider. Requires a model id from the OpenRouter model list and a prompt; not idempotent: each call bills a fresh generation and may return different text for the same input.', idempotent: false },
  auth: openRouterAuth,
  props: {
    model: Property.Dropdown({
      auth: openRouterAuth,
      displayName: 'Model',
      description: 'The model that writes the reply. Type to search by name.',
      required: true,
      refreshers: [],
      defaultValue: 'pygmalionai/mythalion-13b',
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }
        const request: HttpRequest = {
          url: 'https://openrouter.ai/api/v1/models',
          method: HttpMethod.GET,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth.secret_text,
          },
        };
        try {
          const response = await httpClient.sendRequest<openRouterModels>(
            request
          );

          const options = response.body.data.map((model) => {
            return {
              label: model.name || model.id,
              value: model.id,
            };
          });
          return {
            options: options,
            disabled: false,
          };
        } catch {
          return {
            options: [],
            disabled: true,
            placeholder: 'Could not load models. Check your API key and try again.',
          };
        }
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
      placeholder: 'e.g. Summarize the text below in three bullet points',
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      advanced: true,
      description:
        'Randomness from 0 to 2. Lower is focused, higher is creative.',
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      required: false,
      advanced: true,
      description:
        'Longest reply allowed, in tokens. Empty lets the model decide.',
    }),
    topP: Property.Number({
      displayName: 'Top P',
      required: false,
      advanced: true,
      description:
        'Nucleus sampling from 0 to 1. Lower keeps only the likeliest words.',
    }),
  },
  outputSchema: askLmmActionOutputSchema,
  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      temperature: z.optional(z.number().check(z.minimum(0), z.maximum(2))),
      topP: z.optional(z.number().check(z.minimum(0), z.maximum(1.0))),
    });

    const openRouterModel = context.propsValue.model;
    const prompt = context.propsValue.prompt;
    const request: HttpRequest = {
      url: 'https://openrouter.ai/api/v1/chat/completions',
      method: HttpMethod.POST,
      body: {
        prompt: prompt,
        model: openRouterModel,
        temperature: context.propsValue.temperature,
        max_tokens: context.propsValue.maxTokens,
        top_p: context.propsValue.topP,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      headers: {
        'HTTP-Referer': 'https://openrouter.ai/playground',
      },
    };
    const response = await httpClient.sendRequest<promptResponse>(request);
    const responseText = response.body.choices[0].text;
    const trimmedResponse = responseText.trim();
    return trimmedResponse;
  },
});
