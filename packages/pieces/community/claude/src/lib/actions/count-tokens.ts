import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { claudeAuth } from '../auth';

export const countTokensAction = createAction({
  auth: claudeAuth,
  name: 'count_tokens',
  displayName: 'Count Tokens',
  description: 'Calculate token count for a prompt and messages using Anthropic Claude API',
  audience: 'both',
  aiMetadata: {
    description:
      'Calculates the exact input token count for a given text prompt or message list using Anthropic Claude Token Counting API.',
    idempotent: true,
  },
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'Claude model to calculate tokens for',
      required: true,
      defaultValue: 'claude-3-5-sonnet-20241022',
      options: {
        options: [
          { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022' },
          { label: 'Claude 3.5 Haiku', value: 'claude-3-5-haiku-20241022' },
          { label: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
        ],
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'The text content to count tokens for',
      required: true,
    }),
  },
  async run(context) {
    const { model, prompt } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.anthropic.com/v1/messages/count_tokens',
      headers: {
        'x-api-key': context.auth.secret_text,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: {
        model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
    });

    return response.body;
  },
});
