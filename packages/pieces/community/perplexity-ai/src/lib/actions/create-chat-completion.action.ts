import { perplexityAiAuth } from '../../';
import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';

import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const createChatCompletionAction = createAction({
  auth: perplexityAiAuth,
  name: 'ask-ai',
  displayName: 'Ask AI',
  description:
    'Enables users to generate prompt completion based on a specified model.',
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      options: {
        disabled: false,
        options: [
          // https://docs.perplexity.ai/guides/model-cards
          {
            label: 'llama-3.1-sonar-small-128k-online',
            value: 'llama-3.1-sonar-small-128k-online',
          },
          {
            label: 'llama-3.1-sonar-large-128k-online',
            value: 'llama-3.1-sonar-large-128k-online',
          },
          {
            label: 'llama-3.1-sonar-huge-128k-online',
            value: 'llama-3.1-sonar-huge-128k-online',
          },
          {
            label: 'llama-3.1-sonar-small-128k-chat',
            value: 'llama-3.1-sonar-small-128k-chat',
          },
          {
            label: 'llama-3.1-sonar-large-128k-chat',
            value: 'llama-3.1-sonar-large-128k-chat',
          },
          {
            label: 'llama-3.1-8b-instruct',
            value: 'llama-3.1-8b-instruct',
          },
          {
            label: 'llama-3.1-70b-instruct',
            value: 'llama-3.1-70b-instruct',
          },
        ],
      },
    }),
    prompt: Property.LongText({
      displayName: 'Question',
      required: true,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description:
        'The amount of randomness in the response.Higher values are more random, and lower values are more deterministic.',
      defaultValue: 0.2,
    }),
    max_tokens: Property.Number({
      displayName: 'Maximum Tokens',
      required: false,
      description: `Please refer [guide](https://docs.perplexity.ai/guides/model-cards) for each model token limit.`,
    }),
    top_p: Property.Number({
      displayName: 'Top P',
      required: false,
      description:
        'The nucleus sampling threshold, valued between 0 and 1 inclusive. For each subsequent token, the model considers the results of the tokens with top_p probability mass.',
      defaultValue: 0.9,
    }),
    presence_penalty: Property.Number({
      displayName: 'Presence penalty',
      required: false,
      description:
        "Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the mode's likelihood to talk about new topics.",
      defaultValue: 0,
    }),
    frequency_penalty: Property.Number({
      displayName: 'Frequency penalty',
      required: false,
      description:
        "A multiplicative penalty greater than 0. Values greater than 1.0 penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.",
      defaultValue: 1.0,
    }),
    roles: Property.Json({
      displayName: 'Roles',
      required: false,
      description:
        'Array of roles to specify more accurate response.After the (optional) system message, user and assistant roles should alternate with user then assistant, ending in user.',
      defaultValue: [
        { role: 'system', content: 'You are a helpful assistant.' },
      ],
    }),
  },
  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      temperature: z.number().min(0).max(2).optional(),
    });

    const rolesArray = context.propsValue.roles
      ? (context.propsValue.roles as any)
      : [];
    const roles = rolesArray.map((item: any) => {
      const rolesEnum = ['system', 'user', 'assistant'];
      if (!rolesEnum.includes(item.role)) {
        throw new Error(
          'The only available roles are: [system, user, assistant]'
        );
      }

      return {
        role: item.role,
        content: item.content,
      };
    });

    roles.push({ role: 'user', content: context.propsValue.prompt });

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.perplexity.ai/chat/completions',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        model: context.propsValue.model,
        messages: roles,
        temperature: context.propsValue.temperature,
        top_p: context.propsValue.top_p,
        presence_penalty: context.propsValue.presence_penalty,
        frequency_penalty: context.propsValue.frequency_penalty,
      },
    });

    if (response.status === 200) {
      return response.body.choices[0].message.content;
    }

    return response.body;
  },
});
