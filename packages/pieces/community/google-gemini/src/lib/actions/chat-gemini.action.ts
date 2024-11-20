/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpMethod, httpClient, propsValidation } from '@activepieces/pieces-common';
import { googleGeminiAuth } from '../../index';
import {
  Property,
  StoreScope,
  createAction,
} from '@activepieces/pieces-framework';
import mime from 'mime-types';
import { z } from 'zod';

export const chatGemini = createAction({
  auth: googleGeminiAuth,
  name: 'chat_gemini',
  displayName: 'Chat Gemini',
  description: 'Chat with Google Gemini',
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      description:
        'The model to chat with. (For now limited to Gemini Pro, according to Google: "The gemini-pro-vision model (for text-and-image input) is not yet optimized for multi-turn conversations. Make sure to use gemini-pro and text-only input for chat use cases.")',
      defaultValue: 'gemini-pro',
      options: {
        options: [
          {
            label: 'Gemini Pro',
            value: 'gemini-pro',
          },
        ],
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
    let messageHistory: any[] | null = [];
    if (memoryKey) {
      messageHistory = (await store.get(memoryKey, StoreScope.PROJECT)) ?? [];
    }

    const thisMessage = {
      role: 'user',
      parts: [
        {
          text: prompt,
        },
      ],
    };

    messageHistory.push(thisMessage);

    const body = {
      contents: messageHistory,
    };

    const request = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${auth}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body,
    });

    const response = request.body;

    if (memoryKey) {
      messageHistory.push(response['candidates'][0]['content']);
      //This is the text part: response['candidates'][0]['content']['parts'][0]['text']
      //But we want the whole response, so we can store it.
      store.put(memoryKey, messageHistory, StoreScope.PROJECT);
    }

    return request.body;
  },
});
