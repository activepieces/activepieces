import { deepseekAuth } from '../auth';
import { createAction, MarkdownVariant, Property, StoreScope } from "@activepieces/pieces-framework";
import OpenAI from 'openai';
import { baseUrl } from '../common/common';
import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';

export const askDeepseek = createAction({
  audience: 'both',
  auth: deepseekAuth,
  name: 'ask_deepseek',
  classification: 'READ',
  displayName: 'Ask DeepSeek',
  description: 'Send a question or instruction to a DeepSeek model and get a reply.',
  aiMetadata: { description: 'Sends a question to a DeepSeek chat model and returns the generated text, with optional sampling controls and a text-or-JSON response format (JSON mode also requires instructing the model to emit JSON in the prompt); it runs stateless by default, or keeps conversation history across runs and flows when a memory key is set. It is the only action this piece exposes, so use it for any DeepSeek completion and pick a different vendor piece when the model must not be DeepSeek. Requires a model, a question, and a maximum token count; not idempotent: each call produces a fresh completion and, when a memory key is set, appends to the stored history.', idempotent: false },
  propertyGroups: [
    { key: 'settings', display: 'section', label: 'Settings', icon: 'sliders', props: ['model', 'maxTokens'] },
    { key: 'message', display: 'section', label: 'Message', icon: 'text', props: ['responseFormat', 'prompt'] },
    { key: 'history', display: 'section', label: 'History', icon: 'inbox', props: ['memoryKey', 'memoryInfo'] },
  ],
  props: {
    model: Property.Dropdown({
      auth: deepseekAuth,
      displayName: 'Model',
      required: true,
      description: 'deepseek-reasoner thinks first; chat is faster.',
      refreshers: [],
      defaultValue: 'deepseek-chat',
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your DeepSeek account first',
            options: [],
          };
        }
        try {
          const openai = new OpenAI({
            baseURL: baseUrl,
            apiKey: auth.secret_text,
          });
          const response = await openai.models.list();
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
            placeholder: "Couldn't load models. Check your API key.",
          };
        }
      },
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      required: true,
      description: 'Longest reply in tokens, about 4 characters each.',
      defaultValue: 4096,
    }),
    responseFormat: Property.StaticDropdown({
      displayName: 'Response Format',
      description: 'JSON also needs the question to ask for JSON.',
      required: true,
      defaultValue: 'text',
      display: 'cards',
      options: {
        options: [
          {
            label: 'Text',
            value: 'text',
            description: 'Plain reply',
            icon: 'text',
          },
          {
            label: 'JSON',
            value: 'json_object',
            description: 'JSON object',
            icon: 'code',
          },
        ],
      },
    }),
    prompt: Property.LongText({
      displayName: 'Question',
      description: 'What you want the model to answer or do.',
      placeholder: 'e.g. Summarize this email in three bullet points',
      required: true,
    }),
    memoryKey: Property.ShortText({
      displayName: 'Conversation Memory ID',
      description: 'Runs that share this ID continue one conversation. Empty: no memory.',
      placeholder: 'e.g. support-chat-42',
      required: false,
    }),
    memoryInfo: Property.MarkDown({
      value: 'Saved for the whole project, so other flows that use this ID join the same conversation.',
      variant: MarkdownVariant.INFO,
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
      description: 'From -2 to 2. Higher values make repeated lines less likely.',
      defaultValue: 0,
      advanced: true,
    }),
    presencePenalty: Property.Number({
      displayName: 'Presence Penalty',
      required: false,
      description: 'From -2 to 2. Higher values steer the reply toward new topics.',
      defaultValue: 0,
      advanced: true,
    }),
    roles: Property.Json({
      displayName: 'Roles',
      required: false,
      description: 'Messages sent before the question, such as a system instruction.',
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
      baseURL: baseUrl,
      apiKey: auth.secret_text,
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

    const parsedRoles = messageListSchema.safeParse(toRolesInput(propsValue.roles));
    if (!parsedRoles.success) {
      throw new Error('Roles must be a JSON array of { role, content } objects.');
    }
    const roles = parsedRoles.data.map((item) =>
      toChatMessage({
        role: item.role,
        content: item.content,
        invalidRoleMessage: 'The only available roles are: [system, user, assistant]',
      }),
    );

    const storedHistory = memoryKey ? await store.get(memoryKey, StoreScope.PROJECT) : null;
    const parsedHistory = messageListSchema.safeParse(storedHistory ?? []);
    if (!parsedHistory.success) {
      throw new Error('The conversation saved under this memory ID is unreadable. Use a new ID.');
    }
    const previousMessages = parsedHistory.data.map((item) =>
      toChatMessage({
        role: item.role,
        content: item.content,
        invalidRoleMessage: 'The conversation saved under this memory ID is unreadable. Use a new ID.',
      }),
    );

    const messageHistory: OpenAI.Chat.ChatCompletionMessageParam[] = [
      ...previousMessages,
      { role: 'user', content: prompt },
    ];

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

    const reply = completion.choices[0]?.message;
    if (!reply) {
      throw new Error('DeepSeek returned no reply. Try again or pick another model.');
    }

    if (memoryKey) {
      await store.put(
        memoryKey,
        [...messageHistory, { role: reply.role, content: reply.content ?? '' }],
        StoreScope.PROJECT,
      );
    }

    return reply.content;
  },
});

function toRolesInput(roles: unknown): unknown {
  if (!roles) {
    return [];
  }
  if (typeof roles === 'object' && !Array.isArray(roles) && Object.keys(roles).length === 0) {
    return [];
  }
  return roles;
}

function toChatMessage({ role, content, invalidRoleMessage }: ToChatMessageParams): OpenAI.Chat.ChatCompletionMessageParam {
  const parsedRole = chatRoleSchema.safeParse(role);
  if (!parsedRole.success) {
    throw new Error(invalidRoleMessage);
  }
  const messageContent = toMessageContent(content);
  switch (parsedRole.data) {
    case 'system':
      return { role: 'system', content: messageContent };
    case 'user':
      return { role: 'user', content: messageContent };
    case 'assistant':
      return { role: 'assistant', content: messageContent };
  }
}

function toMessageContent(content: unknown): string | z.infer<typeof textPartsSchema> {
  if (typeof content === 'string') {
    return content;
  }
  if (content === null || content === undefined) {
    return '';
  }
  const parsedParts = textPartsSchema.safeParse(content);
  if (parsedParts.success) {
    return parsedParts.data;
  }
  return JSON.stringify(content) ?? '';
}

const chatRoleSchema = z.enum(['system', 'user', 'assistant']);

const textPartsSchema = z.array(z.object({ type: z.literal('text'), text: z.string() }));

const messageListSchema = z.array(z.object({ role: z.string(), content: z.unknown() }));

type ToChatMessageParams = {
  role: string;
  content: unknown;
  invalidRoleMessage: string;
};
