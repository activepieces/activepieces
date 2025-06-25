import {
  createAction,
  Property,
  StoreScope,
} from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { promptxAuth } from '../..';
import { sleep } from '../common/common';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';
import {
  addTokenUsage,
  getAccessToken,
  getAiApiKey,
  getStoreData,
  getUsagePlan,
  PromptXAuthType,
} from '../common/pmtx-api';

export const askAssistant = createAction({
  auth: promptxAuth,
  name: 'ask_assistant',
  displayName: 'Ask Assistant',
  description: 'Ask a GPT assistant anything you want!',
  props: {
    assistant: Property.Dropdown({
      displayName: 'Assistant',
      required: true,
      description: 'The assistant which will generate the completion.',
      refreshers: [],
      options: async ({ auth }) => {
        const promptxAuth = auth as PromptXAuthType;
        let accessToken: string;
        let openApiKey: string;

        try {
          accessToken = await getAccessToken(promptxAuth);
          openApiKey = await getAiApiKey(promptxAuth.server, accessToken);
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Unable to fetch OpenAI key. Check connection',
            options: [],
          };
        }

        try {
          const openai = new OpenAI({ apiKey: openApiKey });
          const assistants = await openai.beta.assistants.list();

          return {
            disabled: false,
            options: assistants.data.map((assistant) => {
              return {
                label: assistant.name ?? `Assistant ${assistant.id}`,
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
        'A memory key that will keep the chat history shared across runs and flows. Keep it empty to leave your assistant without memory of previous messages.',
      required: false,
    }),
  },
  async run({ auth, propsValue, store, project, flows }) {
    const promptxAuth = auth as PromptXAuthType;
    const accessToken = await getAccessToken(promptxAuth);
    const usage = await getUsagePlan(promptxAuth.server, accessToken);

    // Get store data
    const { userId, apiKey } = await getStoreData(
      store,
      promptxAuth.server,
      accessToken
    );
    await propsValidation.validateZod(propsValue, {
      memoryKey: z.string().max(128).optional(),
    });

    const openai = new OpenAI({ apiKey: apiKey });
    const { assistant, prompt, memoryKey } = propsValue;
    const runCheckDelay = 1000;

    let response: OpenAI.Beta.Threads.Messages.Message[] | undefined;
    let thread: { id: string } | null;

    if (memoryKey) {
      // Get existing thread ID or create a new thread for this memory key
      thread = await store.get(memoryKey, StoreScope.PROJECT);
      if (!thread) {
        thread = await openai.beta.threads.create();
        store.put(memoryKey, thread, StoreScope.PROJECT);
      }
    } else {
      thread = await openai.beta.threads.create();
    }

    const message = await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: prompt,
    });

    /*
     * Since there is no prop for specifying a max value directly,
     * we'll use the available tokens as the maximum.
     * Also, this accounts for the limitation on maximum completion tokens.
     */
    const maxTokens = usage.token_available;

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant,
      max_completion_tokens: Math.floor(maxTokens),
    });

    // Wait at least 400ms for inference to finish before checking to save requests
    await sleep(400);
    let inputTokens = 0;
    let outputTokens = 0;
    let totalTokens = 0;
    let model = '';
    let maxPollAttempts = 5;

    while (!response) {
      const runCheck = await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id
      );
      if (runCheck.status === 'completed') {
        // Get the token usage
        const usage = runCheck.usage;
        inputTokens = usage?.prompt_tokens ?? 0;
        outputTokens = usage?.completion_tokens ?? 0;
        totalTokens = usage?.total_tokens ?? 0;
        model = runCheck.model;

        const messages = await openai.beta.threads.messages.list(thread.id);
        // Return only messages that are newer than the user's latest message
        response = messages.data.splice(
          0,
          messages.data.findIndex((m) => m.id == message.id)
        );
        break;
      }

      maxPollAttempts -= 1;
      if (maxPollAttempts <= 0) break;

      await sleep(runCheckDelay);
    }

    addTokenUsage(
      {
        userId: `${userId}`,
        model: model,
        projectId: project.id,
        flowId: flows.current.id,
        component: 'Automationx',
        usage: {
          inputTokens,
          outputTokens,
          totalTokens,
        },
      },
      promptxAuth.server,
      accessToken
    );

    if (!response && maxPollAttempts <= 0) {
      const err = 'Max poll attempts to assistants API breached';
      console.log(err);
      return { error: err };
    }

    return response;
  },
});
