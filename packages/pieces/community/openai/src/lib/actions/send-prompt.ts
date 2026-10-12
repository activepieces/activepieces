import {
  createAction,
  Property,
  StoreScope,
} from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { openaiAuth } from '../auth';
import {
  calculateMessagesTokenSize,
  exceedsHistoryLimit,
  isLLM,
  reduceContextSize,
} from '../common/common';
import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';

export const askOpenAI = createAction({
  audience: 'both',
  auth: openaiAuth,
  name: 'ask_chatgpt',
  classification: 'READ',
  displayName: 'Ask ChatGPT',
  description: 'Send a question or instruction to an OpenAI model and get a reply.',
  aiMetadata: { description: 'Sends a prompt to an OpenAI chat model and returns the reply text, with sampling controls (temperature, top P, frequency and presence penalties) and an optional roles array that supplies the system message. Two modes: stateless by default, or, when a memory key is set, loading and re-saving the conversation history in project storage so later runs continue the same thread, trimming it as it approaches the token limit. This is the general-purpose text call of this piece; prefer ask_assistant to route through a pre-built OpenAI Assistant, vision_prompt when an image is part of the question, and extract-structured-data when the answer must come back as named fields. A model, a question, and a maximum token count are required; not idempotent: each call produces a fresh completion and, with a memory key, rewrites the stored history.', idempotent: false },
  props: {
    model: Property.Dropdown({
  auth: openaiAuth,
      displayName: 'Model',
      required: true,
      description: 'The OpenAI model that writes the reply.',
      refreshers: [],
      defaultValue: 'gpt-3.5-turbo',
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
          const response = await openai.models.list();
          const models = response.data.filter((model) => isLLM(model.id));
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
            placeholder: "Couldn't load models. Check your API key or try again.",
          };
        }
      },
    }),
    prompt: Property.LongText({
      displayName: 'Question',
      description: 'What you want the model to answer or do.',
      placeholder: 'e.g. Summarize this email in three bullet points',
      required: true,
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      required: true,
      description: 'Longest reply in tokens, about 4 characters each.',
      defaultValue: 2048,
    }),
    memoryKey: Property.ShortText({
      displayName: 'Conversation Memory ID',
      description:
        'Runs that share this ID continue one conversation. Empty: no memory.',
      placeholder: 'e.g. support-chat-42',
      required: false,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description: 'From 0 to 2. Lower is more focused, higher is more varied.',
      defaultValue: 1,
      advanced: true,
    }),
    topP: Property.Number({
      displayName: 'Top P',
      required: false,
      description: 'From 0 to 1. Adjust this or Temperature, not both.',
      defaultValue: 1,
      advanced: true,
    }),
    frequencyPenalty: Property.Number({
      displayName: 'Frequency Penalty',
      required: false,
      description:
        'From -2 to 2. Higher values make the model repeat itself less.',
      defaultValue: 0,
      advanced: true,
    }),
    presencePenalty: Property.Number({
      displayName: 'Presence Penalty',
      required: false,
      description:
        'From -2 to 2. Higher values push the model toward new topics.',
      advanced: true,
    }),
    roles: Property.Json({
      displayName: 'Roles',
      required: false,
      description:
        'Messages sent before the question, such as a system instruction.',
      advanced: true,
      defaultValue: [
        { role: 'system', content: 'You are a helpful assistant.' },
      ],
    }),
  },
  async run({ auth, propsValue, store }) {
    await propsValidation.validateZod(propsValue, {
      temperature: z.optional(z.number().check(z.minimum(0), z.maximum(2))),
      memoryKey: z.optional(z.string().check(z.maxLength(128))),
    });
    const openai = new OpenAI({
      apiKey: auth.secret_text,
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
      presence_penalty: presencePenalty ?? undefined,
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
