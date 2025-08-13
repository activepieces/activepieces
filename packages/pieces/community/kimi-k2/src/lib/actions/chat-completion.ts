import {
  createAction,
  Property,
  StoreScope,
} from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { kimiAuth } from '../../index';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';
import {
  calculateMessagesTokenSize,
  exceedsHistoryLimit,
  reduceContextSize,
} from '../common/common';
export const chatCompletion = createAction({
  auth: kimiAuth,
  name: 'kimiChatCompletion',
  displayName: 'Ask Kimi K2',
  description: 'Use Kimi`s chat completion API to ask anything you want',
  props: {
    model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      description:
        'The model which will generate the completion. Some models are suitable for natural language tasks, others specialize in code.',
      refreshers: [],
      defaultValue: 'kimi-k2-0711-preview',
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
            apiKey: auth as string,
            baseURL: 'https://api.moonshot.ai/v1',
          });
          const response = await openai.models.list();
          const models = response.data;
          console.log('Models:', models);
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
          console.log('Error fetching models:', error);
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
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description:
        'Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.',
      defaultValue: 0.9,
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      required: true,
      description:
        "The maximum number of tokens to generate. Requests can use up to 2,048 or 4,096 tokens shared between prompt and completion depending on the model. Don't set the value to maximum and leave some tokens for the input. (One token is roughly 4 characters for normal English text)",
      defaultValue: 1024,
    }),
    topP: Property.Number({
      displayName: 'Top P',
      required: false,
      description:
        'An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.',
      defaultValue: 1.0,
    }),
    frequencyPenalty: Property.Number({
      displayName: 'Frequency penalty',
      required: false,
      description:
        'Frequency penalty, a number between -2.0 and 2.0. A positive value will penalize new tokens based on their existing frequency in the text, reducing the likelihood of the model repeating the same phrases verbatim',
      defaultValue: 0,
    }),
    presencePenalty: Property.Number({
      displayName: 'Presence penalty',
      required: false,
      description:
        'Presence penalty, a number between -2.0 and 2.0. A positive value will penalize new tokens based on whether they appear in the text, increasing the likelihood of the model discussing new topics',
      defaultValue: 0,
    }),
    memoryKey: Property.ShortText({
      displayName: 'Memory Key',
      description:
        'A memory key that will keep the chat history shared across runs and flows. Keep it empty to leave KIMI without memory of previous messages.',
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
      temperature: z.number().min(0).max(1).optional(),
      memoryKey: z.string().max(128).optional(),
    });
    const openai = new OpenAI({
      apiKey: auth,
      baseURL: 'https://api.moonshot.ai/v1',
    });
    const {
      model,
      temperature,
      maxTokens,
      topP,
      frequencyPenalty,
      presencePenalty,
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
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      max_completion_tokens: maxTokens,
    });

    // Add response to message history
    messageHistory = [...messageHistory, completion.choices[0].message];

    // Check message history token size
    // System limit is 32K tokens, we can probably make it bigger but this is a safe spot
    const tokenLength = await calculateMessagesTokenSize(messageHistory, model);
    if (memoryKey) {
      // If tokens exceed 90% system limit or 90% of model limit - maxTokens, reduce history token size
      if (exceedsHistoryLimit(tokenLength, model, maxTokens)) {
        messageHistory = await reduceContextSize(
          messageHistory,
          model,
          maxTokens
        );
      }
      // Store history
      await store.put(memoryKey, messageHistory, StoreScope.PROJECT);
    }

    return completion.choices[0].message.content;
  },
});
