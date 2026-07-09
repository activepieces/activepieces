import { Content, GoogleGenerativeAI } from '@google/generative-ai';
import {
  Property,
  StoreScope,
  createAction,
} from '@activepieces/pieces-framework';
import mime from 'mime-types';
import * as z from 'zod/mini'
import { googleGeminiAuth } from '../auth';
import { defaultLLM, getGeminiModelOptions } from '../common/common';
import { propsValidation } from '@activepieces/pieces-common';
import { chatGeminiActionOutputSchema } from '../output-schemas';

export const chatGemini = createAction({
  audience: 'human',
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
      auth: googleGeminiAuth,
      defaultValue: defaultLLM,
      options: async ({ auth }) => getGeminiModelOptions({ auth }),
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
  outputSchema: chatGeminiActionOutputSchema,
  async run({ auth, propsValue, store }) {
    await propsValidation.validateZod(propsValue, {
      memoryKey: z.optional(z.string().check(z.maxLength(128))),
    });

    const { model, prompt, memoryKey } = propsValue;  
    const genAI = new GoogleGenerativeAI(auth.secret_text);
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
