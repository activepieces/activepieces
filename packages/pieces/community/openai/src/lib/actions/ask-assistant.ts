import {
  createAction,
  Property,
  StoreScope,
} from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { openaiAuth } from '../auth';
import { sleep } from '../common/common';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';
import { isObject } from '@activepieces/shared';

export const askAssistant = createAction({
  auth: openaiAuth,
  name: 'ask_assistant',
  displayName: 'Ask Assistant',
  description: 'Ask a ChatGPT Assistant anything you want!',
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'The base URL for the OpenAI API. Default is https://api.openai.com/v1',
      required: false,
    }),
    assistant: Property.Dropdown({
      displayName: 'Assistant',
      required: true,
      description: 'The assistant which will generate the completion.',
      refreshers: ['baseUrl'],
      options: async ({ auth, propsValue }) => {
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
            baseURL: (propsValue['baseUrl'] as string) || undefined,
          });
          const assistants = await openai.beta.assistants.list();
          return {
            disabled: false,
            options: assistants.data.map((assistant) => {
              return {
                label: assistant.name || assistant.id,
                value: assistant.id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: "Couldn't load assistants, API key is invalid",
          };
        }
      },
    }),
    prompt: Property.LongText({
      displayName: 'Question',
      required: true,
    }),
    memoryKey: Property.ShortText({
      displayName: 'Memory Key',
      description:
        'A memory key that will keep the chat history shared across runs and flows. Keep it empty to leave ChatGPT without memory of previous messages.',
      required: false,
    }),
  },
  async run({ auth, propsValue, store }) {
    await propsValidation.validateZod(propsValue, {
      memoryKey: z.string().max(128).optional(),
    });

    const openai = new OpenAI({
      apiKey: auth as string,
      baseURL: propsValue.baseUrl || undefined,
    });
    const { assistant, prompt, memoryKey } = propsValue;

    let threadId: any = null;
    if (memoryKey) {
      const storedValue = await store.get(memoryKey, StoreScope.PROJECT);
      if (storedValue) {
        // Migration guard: old code stored full Thread object, new code stores string ID
        threadId = isObject(storedValue) ? (storedValue as any).id : storedValue;
      }
    }

    if (!threadId) {
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
      if (memoryKey) {
        await store.put(memoryKey, threadId, StoreScope.PROJECT);
      }
    }

    const message = await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: prompt,
    });

    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistant,
    });

    let response: any = null;
    const runCheckDelay = 1000;
    while (true) {
      const runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      if (runStatus.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(threadId);
        // Return only messages that are newer than the user's latest message (matching original behavior)
        response = messages.data.splice(
          0,
          messages.data.findIndex((m) => m.id == message.id)
        );
        break;
      }
      if (['failed', 'cancelled', 'expired'].includes(runStatus.status)) {
        throw new Error(`Assistant run ${runStatus.status}: ${JSON.stringify(runStatus.last_error)}`);
      }

      await sleep(runCheckDelay);
    }

    return response;
  },
});
