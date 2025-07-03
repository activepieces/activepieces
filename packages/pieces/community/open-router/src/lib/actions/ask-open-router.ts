import { openRouterAuth } from '../../index';
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
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const askOpenRouterAction = createAction({
  name: 'ask-lmm',
  displayName: 'Ask LLM',
  description: 'Ask any model supported by Open Router.',
  auth: openRouterAuth,
  props: {
    model: Property.Dropdown({
      displayName: 'Model',
      description:
        'The model which will generate the completion. Some models are suitable for natural language tasks, others specialize in code.',
      required: true,
      refreshers: [],
      defaultValue: 'pygmalionai/mythalion-13b',
      options: async ({ auth }) => {
        const request: HttpRequest = {
          url: 'https://openrouter.ai/api/v1/models',
          method: HttpMethod.GET,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth as string,
          },
        };
        try {
          const response = await httpClient.sendRequest<openRouterModels>(
            request
          );

          const options = response.body.data.map((model) => {
            return {
              label: model.id,
              value: model.id,
            };
          });
          return {
            options: options,
            disabled: false,
          };
        } catch (error) {
          return {
            options: [],
            disabled: true,
            placeholder: `Couldn't Load Models:\n${error}`,
          };
        }
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
      description: 'The prompt to send to the model.',
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description:
        'Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.',
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      required: false,
      description:
        "The maximum number of tokens to generate. Requests can use up to 2,048 or 4,096 tokens shared between prompt and completion, don't set the value to maximum and leave some tokens for the input. The exact limit varies by model. (One token is roughly 4 characters for normal English text)",
    }),
    topP: Property.Number({
      displayName: 'Top P',
      required: false,
      description:
        'An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.',
    }),
  },
  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      temperature: z.number().min(0).max(1.0).optional(),
      topP: z.number().min(0).max(1.0).optional(),
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
        token: context.auth,
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
