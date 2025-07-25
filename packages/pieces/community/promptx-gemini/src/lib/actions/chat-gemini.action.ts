import { Content, GoogleGenerativeAI } from '@google/generative-ai';
import {
  Property,
  StoreScope,
  createAction,
} from '@activepieces/pieces-framework';
import { z } from 'zod';
import { googleGeminiAuth } from '../../index';
import { defaultLLM, getGeminiModelOptions } from '../common/common';
import { propsValidation } from '@activepieces/pieces-common';
import { getApiKeyFormAuth, PromptXAuthType } from '../common/pmtx-api';

export const chatGemini = createAction({
  auth: googleGeminiAuth,
  name: 'chat_gemini',
  displayName: 'Chat Gemini',
  description: 'Chat with Google Gemini',
  props: {
    model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      description: 'The model which will generate the completion',
      refreshers: [],
      defaultValue: defaultLLM,
      options: async ({ auth }) => {
        let geminiKey: string;
        try {
          geminiKey = String(await getApiKeyFormAuth(auth as PromptXAuthType));
        } catch (error) {
          console.error(error);
          return {
            disabled: true,
            placeholder: 'Unable to fetch OpenAI key. Check connection',
            options: [],
          };
        }

        return getGeminiModelOptions({ auth: geminiKey });
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
      description: 'The prompt to generate content from.',
    }),
    memoryKey: Property.ShortText({
      displayName: 'Memory Key',
      description:
        'A memory key that will keep the chat history. Keep it empty to leave Gemini without memory of previous messages.',
      required: false,
    }),
  },
  async run({ auth, propsValue, store }) {
    await propsValidation.validateZod(propsValue, {
      memoryKey: z.string().max(128).optional(),
    });

    const { model, prompt, memoryKey } = propsValue;
    const geminiKey: string = await getApiKeyFormAuth(auth as PromptXAuthType);
    const genAI = new GoogleGenerativeAI(geminiKey);
    const geminiModel = genAI.getGenerativeModel({ model });
    let history: Content[] = [];

    if (memoryKey) {
      const storedHistory = await store.get(memoryKey, StoreScope.PROJECT);
      if (Array.isArray(storedHistory)) {
        history = storedHistory;
      }
    }

    const chat = geminiModel.startChat({
      history: history,
    });

    const result = await chat.sendMessage(prompt);
    const responseText = result.response.text();

    if (memoryKey) {
      const updatedHistory = await chat.getHistory();
      await store.put(memoryKey, updatedHistory, StoreScope.PROJECT);
    }

    return {
      response: responseText,
      history: history,
    };
  },
});
