import {
  createAction,
  Property,
  StoreScope,
} from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import * as z from 'zod/mini';
import { propsValidation } from '@activepieces/pieces-common';
import { daoxeAuth } from '../auth';
import { DEFAULT_BASE_URL } from '../common/common';

export const askDaoxe = createAction({
  audience: 'human',
  auth: daoxeAuth,
  name: 'ask_daoxe',
  displayName: 'Ask DaoXE',
  description:
    'Send a chat completion request via DaoXE OpenAI-compatible gateway.',
  props: {
    model: Property.Dropdown({
      auth: daoxeAuth,
      displayName: 'Model',
      required: true,
      description:
        'Exact model ID available to your DaoXE account (from GET /v1/models).',
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Enter your API key first',
            options: [],
          };
        }
        try {
          const props = auth as { props: { apiKey: string; baseUrl?: string } };
          const baseURL = (props.props.baseUrl || DEFAULT_BASE_URL).replace(
            /\/$/,
            '',
          );
          const openai = new OpenAI({
            baseURL,
            apiKey: props.props.apiKey,
          });
          const response = await openai.models.list();
          return {
            disabled: false,
            options: response.data.map((model) => ({
              label: model.id,
              value: model.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: "Couldn't load models; check API key and base URL",
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
      defaultValue: 1,
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      required: false,
      defaultValue: 1024,
    }),
    memoryKey: Property.ShortText({
      displayName: 'Memory Key',
      description:
        'Optional memory key to keep chat history across runs. Leave empty for stateless calls.',
      required: false,
    }),
  },
  async run({ auth, propsValue, store }) {
    await propsValidation.validateZod(propsValue, {
      temperature: z.optional(z.number().check(z.minimum(0), z.maximum(2))),
      memoryKey: z.optional(z.string().check(z.maxLength(128))),
    });

    const baseURL = (auth.props.baseUrl || DEFAULT_BASE_URL).replace(
      /\/$/,
      '',
    );
    const openai = new OpenAI({
      baseURL,
      apiKey: auth.props.apiKey,
    });

    const { model, prompt, temperature, maxTokens, memoryKey } = propsValue;

    let messageHistory: { role: string; content: string }[] = [];
    if (memoryKey) {
      messageHistory =
        (await store.get(memoryKey, StoreScope.PROJECT)) ?? [];
    }

    messageHistory.push({
      role: 'user',
      content: prompt,
    });

    const completion = await openai.chat.completions.create({
      model,
      messages: messageHistory as OpenAI.Chat.ChatCompletionMessageParam[],
      temperature: temperature ?? undefined,
      max_tokens: maxTokens ?? undefined,
    });

    const assistant = completion.choices[0]?.message?.content ?? '';
    messageHistory.push({
      role: 'assistant',
      content: assistant,
    });

    if (memoryKey) {
      await store.put(memoryKey, messageHistory, StoreScope.PROJECT);
    }

    return {
      result: assistant,
      usage: completion.usage,
      model: completion.model,
    };
  },
});
