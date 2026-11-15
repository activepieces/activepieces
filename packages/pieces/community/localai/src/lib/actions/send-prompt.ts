import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { localaiAuth } from '../auth';
import { localaiCommon } from '../common';

export const askLocalAI = createAction({
  audience: 'both',
  auth: localaiAuth,
  name: 'ask_localai',
  classification: 'READ',
  displayName: 'Ask LocalAI',
  description: 'Send a question to a chat model on your LocalAI server.',
  aiMetadata: { description: 'Sends a prompt to a chat model running on your own self-hosted LocalAI server, through the OpenAI-compatible chat completions endpoint at the server URL stored on the connection, with optional sampling controls and a roles array for system or assistant priming, and returns the reply as plain text. It keeps no conversation memory, so every call is stateless. Pick it only when inference must stay on your own LocalAI instance rather than a cloud provider such as OpenAI, Groq, or DeepSeek. Requires a question and a model id installed on that instance: call list_models first when unsure which ids exist. Use create_embedding for vectors, text_to_speech or transcribe_audio for audio, and the Custom API Call action for other LocalAI endpoints. Not idempotent: each call produces a fresh completion.', idempotent: false },
  propertyGroups: [
    {
      key: 'settings',
      display: 'section',
      label: 'Settings',
      icon: 'sliders',
      props: ['model', 'maxTokens'],
    },
    {
      key: 'message',
      display: 'section',
      label: 'Message',
      icon: 'text',
      props: ['prompt'],
    },
  ],
  props: {
    model: localaiCommon.modelDropdown({
      displayName: 'Model',
      description:
        'The chat model on your LocalAI server that will write the answer.',
    }),
    prompt: Property.LongText({
      displayName: 'Question',
      description: 'What you want the model to answer or do.',
      placeholder: 'e.g. Summarize this email in three bullet points',
      required: true,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description: 'From 0 to 2. Lower is more focused, higher is more varied.',
      defaultValue: 0.9,
      advanced: true,
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      required: false,
      description: 'Longest reply in tokens, about 4 characters each. Empty: 2048.',
      defaultValue: 2048,
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
      description: 'From -2 to 2. Higher makes the model repeat itself less.',
      defaultValue: 0,
      advanced: true,
    }),
    presencePenalty: Property.Number({
      displayName: 'Presence Penalty',
      required: false,
      description: 'From -2 to 2. Higher pushes the model toward new topics.',
      defaultValue: 0.6,
      advanced: true,
    }),
    roles: Property.Json({
      displayName: 'Roles',
      required: false,
      description: 'Messages sent before the question, each with a role and content.',
      advanced: true,
      defaultValue: [
        { role: 'system', content: 'You are a helpful assistant.' },
      ],
    }),
  },
  async run({ auth, propsValue }) {
    const roles = parseRoles(propsValue.roles);

    try {
      const completion = await localaiCommon
        .client(auth)
        .chat.completions.create({
          model: propsValue.model,
          messages: [...roles, { role: 'user', content: propsValue.prompt }],
          temperature: propsValue.temperature ?? 0.9,
          max_tokens: propsValue.maxTokens ?? 2048,
          top_p: propsValue.topP ?? 1,
          frequency_penalty: propsValue.frequencyPenalty ?? 0,
          presence_penalty: propsValue.presencePenalty ?? 0.6,
        });
      return completion.choices[0]?.message?.content?.trim();
    } catch (error) {
      throw localaiCommon.friendlyError(error);
    }
  },
});

function parseRoles(value: unknown): ChatMessage[] {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new Error(
      'Roles must be an array of { "role": "system" | "user" | "assistant", "content": "..." }.'
    );
  }
  return value.map((item: unknown) => toMessage(item));
}

function toMessage(item: unknown): ChatMessage {
  if (
    typeof item !== 'object' ||
    item === null ||
    !('role' in item) ||
    !isRole(item.role)
  ) {
    throw new Error('The only available roles are: [system, user, assistant]');
  }
  const content = 'content' in item ? item.content : '';
  if (typeof content === 'string') {
    return { role: item.role, content };
  }
  if (!Array.isArray(content)) {
    throw new Error(
      'Each role content must be text or an array of content parts.'
    );
  }
  if (item.role === 'user') {
    return { role: 'user', content: content.map(toUserPart) };
  }
  return { role: item.role, content: content.map(toTextPart) };
}

function toUserPart(part: unknown): ChatCompletionContentPart {
  if (isImagePart(part)) {
    return {
      type: 'image_url',
      image_url: {
        url: part.image_url.url,
        ...(part.image_url.detail ? { detail: part.image_url.detail } : {}),
      },
    };
  }
  return toTextPart(part);
}

function toTextPart(part: unknown): ChatCompletionContentPartText {
  if (
    typeof part === 'object' &&
    part !== null &&
    'type' in part &&
    part.type === 'text' &&
    'text' in part &&
    typeof part.text === 'string'
  ) {
    return { type: 'text', text: part.text };
  }
  throw new Error(
    'Content parts must be { "type": "text", "text": "..." }, or { "type": "image_url", "image_url": { "url": "..." } } in user messages.'
  );
}

function isImagePart(part: unknown): part is ImagePart {
  if (
    typeof part !== 'object' ||
    part === null ||
    !('type' in part) ||
    part.type !== 'image_url' ||
    !('image_url' in part)
  ) {
    return false;
  }
  const image = part.image_url;
  if (
    typeof image !== 'object' ||
    image === null ||
    !('url' in image) ||
    typeof image.url !== 'string'
  ) {
    return false;
  }
  return (
    !('detail' in image) ||
    image.detail === undefined ||
    image.detail === 'auto' ||
    image.detail === 'low' ||
    image.detail === 'high'
  );
}

function isRole(role: unknown): role is 'system' | 'user' | 'assistant' {
  return role === 'system' || role === 'user' || role === 'assistant';
}

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;
type ChatCompletionContentPart = OpenAI.Chat.Completions.ChatCompletionContentPart;
type ChatCompletionContentPartText =
  OpenAI.Chat.Completions.ChatCompletionContentPartText;
type ImagePart = {
  type: 'image_url';
  image_url: { url: string; detail?: 'auto' | 'low' | 'high' };
};
