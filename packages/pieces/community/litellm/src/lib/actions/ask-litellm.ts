import { createAction, Property, StoreScope } from '@activepieces/pieces-framework';
import { litellmAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import type { DropdownState } from '@activepieces/pieces-framework';

export const askLitellm = createAction({
  auth: litellmAuth,
  name: 'ask-ai',
  displayName: 'Ask AI',
  description: 'Send a prompt to any model available on your LiteLLM proxy.',
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'LiteLLM proxy base URL (e.g. http://localhost:4000)',
      required: true,
      defaultValue: 'http://localhost:4000',
    }),
    model: Property.Dropdown<string, true, typeof litellmAuth>({
      auth: litellmAuth,
      displayName: 'Model',
      required: true,
      description: 'The model to use for completion.',
      refreshers: ['baseUrl'] as const,
      options: async ({ auth, baseUrl }): Promise<DropdownState<string>> => {
        if (!baseUrl) {
          return {
            disabled: true,
            placeholder: 'Please enter your LiteLLM proxy base URL first.',
            options: [],
          };
        }
        try {
          const headers: Record<string, string> = {};
          if (auth) {
            headers['Authorization'] = `Bearer ${(auth as unknown as { secret_text: string }).secret_text}`;
          }
          const response = await httpClient.sendRequest({
            url: `${(baseUrl as string).replace(/\/+$/, '')}/v1/models`,
            method: HttpMethod.GET,
            headers,
          });
          const models = response.body.data as Array<{ id: string }>;
          return {
            disabled: false,
            options: models.map((model: { id: string }) => ({
              label: model.id,
              value: model.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: "Couldn't load models. Check your proxy URL and API key.",
          };
        }
      },
    }),
    prompt: Property.LongText({
      displayName: 'Question',
      required: true,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description: 'Controls randomness (0-2). Lower values are more deterministic.',
      defaultValue: 0.7,
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      required: false,
      description: 'Maximum number of tokens to generate.',
      defaultValue: 2048,
    }),
    memoryKey: Property.ShortText({
      displayName: 'Memory Key',
      description: 'A key to maintain chat history across runs. Leave empty for stateless calls.',
      required: false,
    }),
    systemMessage: Property.LongText({
      displayName: 'System Message',
      description: 'Optional system prompt to set the behavior of the model.',
      required: false,
    }),
  },
  async run({ auth, propsValue, store }) {
    const { baseUrl, model, temperature, maxTokens, prompt, memoryKey, systemMessage } = propsValue;

    let messageHistory: Array<{ role: string; content: string }> = [];

    if (memoryKey) {
      messageHistory = (await store.get(memoryKey, StoreScope.PROJECT)) ?? [];
    }

    const messages: Array<{ role: string; content: string }> = [];

    if (systemMessage) {
      messages.push({ role: 'system', content: systemMessage });
    }

    messages.push(...messageHistory);
    messages.push({ role: 'user', content: prompt });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (auth) {
      headers['Authorization'] = `Bearer ${(auth as unknown as { secret_text: string }).secret_text}`;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${(baseUrl as string).replace(/\/+$/, '')}/chat/completions`,
      headers,
      body: {
        model,
        messages,
        ...(temperature !== undefined && temperature !== null ? { temperature } : {}),
        ...(maxTokens !== undefined && maxTokens !== null ? { max_tokens: maxTokens } : {}),
      },
    });

    const body = response.body;
    if (body.error) {
      throw new Error(body.error.message ?? JSON.stringify(body.error));
    }
    if (!body.choices || body.choices.length === 0) {
      throw new Error('LiteLLM returned no choices in the response.');
    }
    const content = body.choices[0].message.content;

    if (memoryKey) {
      const updatedHistory = [
        ...messageHistory,
        { role: 'user', content: prompt },
        { role: 'assistant', content },
      ];
      await store.put(memoryKey, updatedHistory, StoreScope.PROJECT);
    }

    return { content };
  },
});
