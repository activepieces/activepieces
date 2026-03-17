import { minimaxAuth } from '../auth';
import {
  createAction,
  Property,
  StoreScope,
} from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { baseUrl, defaultModels } from '../common/common';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const askMinimax = createAction({
  auth: minimaxAuth,
  name: 'ask_minimax',
  displayName: 'Ask MiniMax',
  description: 'Ask MiniMax anything you want!',
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      description:
        'The model which will generate the completion. MiniMax-M2.5 offers peak performance, while MiniMax-M2.5-highspeed provides the same performance with faster speed.',
      defaultValue: 'MiniMax-M2.5',
      options: {
        options: defaultModels,
      },
    }),
    prompt: Property.LongText({
      displayName: 'Question',
      required: true,
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      required: true,
      description:
        'The maximum number of tokens to generate. Both models support up to 192K output tokens.',
      defaultValue: 4096,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description:
        'Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive. Must be between 0 (exclusive) and 1 (inclusive). Default is 1.',
      defaultValue: 1,
    }),
    topP: Property.Number({
      displayName: 'Top P',
      required: false,
      description:
        'An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered. Values <= 1. We generally recommend altering this or temperature but not both.',
      defaultValue: 1,
    }),
    memoryKey: Property.ShortText({
      displayName: 'Memory Key',
      description:
        'A memory key that will keep the chat history shared across runs and flows. Keep it empty to leave MiniMax without memory of previous messages.',
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
      temperature: z.number().gt(0).lte(1).optional(),
      memoryKey: z.string().max(128).optional(),
    });
    const openai = new OpenAI({
      baseURL: baseUrl,
      apiKey: auth.secret_text,
    });
    const { model, temperature, maxTokens, topP, prompt, memoryKey } =
      propsValue;

    let messageHistory: any[] | null = [];
    if (memoryKey) {
      messageHistory = (await store.get(memoryKey, StoreScope.PROJECT)) ?? [];
    }

    messageHistory.push({ role: 'user', content: prompt });

    const rolesArray = propsValue.roles ? (propsValue.roles as any) : [];
    const roles = rolesArray.map((item: any) => {
      const rolesEnum = ['system', 'user', 'assistant'];
      if (!rolesEnum.includes(item.role)) {
        throw new Error(
          'The only available roles are: [system, user, assistant]'
        );
      }
      return { role: item.role, content: item.content };
    });

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [...roles, ...messageHistory],
      temperature: temperature ?? 1,
      max_tokens: maxTokens,
      top_p: topP,
    });

    messageHistory = [...messageHistory, completion.choices[0].message];

    if (memoryKey) {
      await store.put(memoryKey, messageHistory, StoreScope.PROJECT);
    }

    return completion.choices[0].message.content;
  },
});
