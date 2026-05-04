import { avianAuth } from '../auth';
import { createAction, Property, StoreScope } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { baseUrl } from '../common/common';
import { z } from 'zod';
import { propsValidation, httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const askAvian = createAction({
  auth: avianAuth,
  name: 'ask_avian',
  displayName: 'Ask Avian',
  description: 'Ask Avian anything you want!',
  props: {
    model: Property.Dropdown({
      auth: avianAuth,
      displayName: 'Model',
      required: true,
      description: 'The model which will generate the completion.',
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
          const response = await httpClient.sendRequest<{
            data: Array<{ id: string }>;
          }>({
            method: HttpMethod.GET,
            url: `${baseUrl}/models`,
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: auth.secret_text,
            },
          });
          return {
            disabled: false,
            options: response.body.data.map((model) => {
              return {
                label: model.id,
                value: model.id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: "Couldn't load models, API key is invalid",
          };
        }
      },
    }),
    prompt: Property.LongText({
      displayName: 'Question',
      required: true,
    }),
    frequencyPenalty: Property.Number({
      displayName: 'Frequency penalty',
      required: false,
      description:
        "Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.",
      defaultValue: 0,
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      required: true,
      description:
        'The maximum number of tokens to generate.',
      defaultValue: 4096,
    }),
    presencePenalty: Property.Number({
      displayName: 'Presence penalty',
      required: false,
      description:
        "Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the mode's likelihood to talk about new topics.",
      defaultValue: 0,
    }),
    responseFormat: Property.StaticDropdown({
      displayName: 'Response Format',
      description:
        'The format of the response. IMPORTANT: When using JSON Output, you must also instruct the model to produce JSON yourself',
      required: true,
      defaultValue: 'text',
      options: {
        options: [
          {
            label: 'Text',
            value: 'text',
          },
          {
            label: 'JSON',
            value: 'json_object',
          },
        ],
      },
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description:
        'Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive. Between 0 and 2. We generally recommend altering this or top_p but not both.',
      defaultValue: 1,
    }),
    topP: Property.Number({
      displayName: 'Top P',
      required: false,
      description:
        'An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered. Values <=1. We generally recommend altering this or temperature but not both.',
      defaultValue: 1,
    }),
    memoryKey: Property.ShortText({
      displayName: 'Memory Key',
      description:
        'A memory key that will keep the chat history shared across runs and flows. Keep it empty to leave Avian without memory of previous messages.',
      required: false,
    }),
    roles: Property.Json({
      displayName: 'Roles',
      required: false,
      description: 'Array of roles to specify more accurate response',
      defaultValue: [
        { role: 'system', content: 'You are a helpful assistant.' },
      ],
    }),
  },
  async run({ auth, propsValue, store }) {
    await propsValidation.validateZod(propsValue, {
      temperature: z.number().min(0).max(2).optional(),
      memoryKey: z.string().max(128).optional(),
    });
    const openai = new OpenAI({
      baseURL: baseUrl,
      apiKey: auth.secret_text,
    });
    const {
      model,
      temperature,
      maxTokens,
      topP,
      frequencyPenalty,
      presencePenalty,
      responseFormat,
      prompt,
      memoryKey,
    } = propsValue;

    let messageHistory: any[] | null = [];
    if (memoryKey) {
      messageHistory = (await store.get(memoryKey, StoreScope.PROJECT)) ?? [];
    }

    messageHistory.push({
      role: 'user',
      content: prompt,
    });

    const rolesArray = propsValue.roles ? (propsValue.roles as any) : [];
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

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [...roles, ...messageHistory],
      temperature: temperature,
      max_tokens: maxTokens,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      response_format: responseFormat === 'json_object' ? { type: 'json_object' } : { type: 'text' },
    });

    messageHistory = [...messageHistory, completion.choices[0].message];

    if (memoryKey) {
      // Prevent unbounded memory growth that would exceed the context window.
      // Keep the most recent messages, dropping the oldest ones first.
      const MAX_HISTORY_MESSAGES = 50;
      if (messageHistory.length > MAX_HISTORY_MESSAGES) {
        messageHistory = messageHistory.slice(
          messageHistory.length - MAX_HISTORY_MESSAGES
        );
      }
      await store.put(memoryKey, messageHistory, StoreScope.PROJECT);
    }

    return completion.choices[0].message.content;
  },
});
