import {
  createAction,
  Property,
  StoreScope,
} from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { openaiAuth } from '../auth';
import { sleep } from '../common/common';
import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';
import { askAssistantActionOutputSchema } from '../output-schemas';

export const askAssistant = createAction({
  audience: 'both',
  auth: openaiAuth,
  name: 'ask_assistant',
  classification: 'WRITE',
  displayName: 'Ask Assistant',
  description: 'Send a question to an assistant you set up in OpenAI.',
  aiMetadata: { description: 'Sends a question to a GPT Assistant that already exists in the connected OpenAI account, selected from the assistant dropdown, and waits for the Assistants run to finish before returning the assistant messages produced after that question. Two modes: with a memory key it reuses one stored thread across runs and flows so the assistant remembers earlier turns, without one it opens a throwaway thread each time. Prefer ask_chatgpt when there is no saved Assistant or when the model and sampling parameters must be chosen per call. Requires an assistant already configured on the OpenAI side; not idempotent: each call creates a thread message and a new run.', idempotent: false },
  props: {
    assistant: Property.Dropdown({
  auth: openaiAuth,
      displayName: 'Assistant',
      required: true,
      description: 'An assistant from your OpenAI account.',
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
          const openai = new OpenAI({
            apiKey: auth.secret_text,
          });
          const assistants = await openai.beta.assistants.list();

          return {
            disabled: false,
            options: assistants.data.map((assistant) => {
              return {
                label: assistant.name ?? assistant.id,
                value: assistant.id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: "Couldn't load assistants. Check your API key or try again.",
          };
        }
      },
    }),
    prompt: Property.LongText({
      displayName: 'Question',
      description: 'What you want the assistant to answer or do.',
      placeholder: 'e.g. Draft a reply to this customer',
      required: true,
    }),
    memoryKey: Property.ShortText({
      displayName: 'Conversation Memory ID',
      description:
        'Runs that share this ID continue one conversation. Empty: no memory.',
      placeholder: 'e.g. support-chat-42',
      required: false,
    }),
  },
  outputSchema: askAssistantActionOutputSchema,
  async run({ auth, propsValue, store }) {
    await propsValidation.validateZod(propsValue, {
      memoryKey: z.optional(z.string().check(z.maxLength(128))),
    });

    const openai = new OpenAI({
      apiKey: auth.secret_text,
    });
    const { assistant, prompt, memoryKey } = propsValue;
    const runCheckDelay = 1000;
    const failedRunStatuses: string[] = [
      'failed',
      'cancelled',
      'expired',
      'incomplete',
      'requires_action',
    ];
    let response: any;
    let thread: any;

    if (memoryKey) {
      // Get existing thread ID or create a new thread for this memory key
      thread = await store.get(memoryKey, StoreScope.PROJECT);
      if (!thread) {
        thread = await openai.beta.threads.create();

        await store.put(memoryKey, thread, StoreScope.PROJECT);
      }
    } else {
      thread = await openai.beta.threads.create();
    }

    const message = await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: prompt,
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant,
    });
    // Wait at least 400ms for inference to finish before checking to save requests
    await sleep(400);

    while (!response) {
      const runCheck = await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id
      );
      if (runCheck.status == 'completed') {
        const messages = await openai.beta.threads.messages.list(thread.id);
        // Return only messages that are newer than the user's latest message
        response = messages.data.splice(
          0,
          messages.data.findIndex((m) => m.id == message.id)
        );
        break;
      }
      if (failedRunStatuses.includes(runCheck.status)) {
        const reason = runCheck.last_error?.message;
        throw new Error(
          reason
            ? `The assistant run ended with status ${runCheck.status}: ${reason}`
            : `The assistant run ended with status ${runCheck.status}.`
        );
      }

      await sleep(runCheckDelay);
    }

    return response;
  },
});
