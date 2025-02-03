import { deepseekAuth } from '../../index';
import { createAction, Property, StoreScope } from "@activepieces/pieces-framework";
import OpenAI from 'openai';
import { baseUrl } from '../common/common';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const askDeepseek = createAction({
  auth: deepseekAuth,
  name: 'ask_deepseek',
  displayName: 'Ask Deepseek',
  description: 'Ask Deepseek anything you want!',
  props: {
    model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      description: 'The model which will generate the completion.',
      refreshers: [],
      defaultValue: 'deepseek-chat',
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Enter your API key first',
            options: [],
          };
        }
        try {
          const openai = new OpenAI({
            baseURL: baseUrl,
            apiKey: auth as string,
          });
          const response = await openai.models.list();
          // We need to get only LLM models
          const models = response.data;
          return {
            disabled: false,
            options: models.map((model) => {
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
        'The maximum number of tokens to generate. Possible values are between 1 and 8192.',
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
        'A memory key that will keep the chat history shared across runs and flows. Keep it empty to leave Deepseek without memory of previous messages.',
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
      apiKey: auth,
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
    // If memory key is set, retrieve messages stored in history
    if (memoryKey) {
      messageHistory = (await store.get(memoryKey, StoreScope.PROJECT)) ?? [];
    }

    // Add user prompt to message history
    messageHistory.push({
      role: 'user',
      content: prompt,
    });

    // Add system instructions if set by user
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

    // Send prompt
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [...roles, ...messageHistory],
      temperature: temperature,
      max_tokens: maxTokens,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      response_format: responseFormat === "json_object" ? { "type": "json_object" } : { "type": "text" },
    });

    messageHistory = [...messageHistory, completion.choices[0].message];

    if (memoryKey) {
      await store.put(memoryKey, messageHistory, StoreScope.PROJECT);
    }

    return completion.choices[0].message.content;
  },
});

