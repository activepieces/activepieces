import { createAction, Property } from '@activepieces/pieces-framework';
import { localaiAuth } from '../auth';
import { localaiCommon } from '../common';

export const askLocalAI = createAction({
  audience: 'both',
  auth: localaiAuth,
  name: 'ask_localai',
  classification: 'READ',
  displayName: 'Ask LocalAI',
  description: 'Ask LocalAI anything you want!',
  aiMetadata: { description: 'Sends a prompt to a chat model running on your own self-hosted LocalAI server, through the OpenAI-compatible chat completions endpoint at the server URL stored on the connection, with optional sampling controls and a roles array for system or assistant priming, and returns the reply as plain text. It keeps no conversation memory, so every call is stateless. Pick it only when inference must stay on your own LocalAI instance rather than a cloud provider such as OpenAI, Groq, or DeepSeek. Requires a question and a model id installed on that instance: call list_models first when unsure which ids exist. Use create_embedding for vectors, text_to_speech or transcribe_audio for audio, and the Custom API Call action for other LocalAI endpoints. Not idempotent: each call produces a fresh completion.', idempotent: false },
  props: {
    model: localaiCommon.modelDropdown({
      displayName: 'Model',
      description:
        'The chat model on your LocalAI server that will write the answer.',
    }),
    prompt: Property.LongText({
      displayName: 'Question',
      required: true,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description: 'Higher is more random, lower is more focused. Defaults to 0.9.',
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      required: false,
      description: 'Longest answer to generate, in tokens. Defaults to 2048.',
    }),
    topP: Property.Number({
      displayName: 'Top P',
      required: false,
      description: 'Nucleus sampling, from 0 to 1. Defaults to 1.',
    }),
    frequencyPenalty: Property.Number({
      displayName: 'Frequency penalty',
      required: false,
      description: 'From -2 to 2. Higher repeats lines less. Defaults to 0.',
    }),
    presencePenalty: Property.Number({
      displayName: 'Presence penalty',
      required: false,
      description: 'From -2 to 2. Higher moves to new topics. Defaults to 0.6.',
    }),
    roles: Property.Json({
      displayName: 'Roles',
      required: false,
      description: 'Messages sent before the question, each with a role and content.',
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

function parseRoles(value: unknown): RoleMessage[] {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new Error(
      'Roles must be an array of { "role": "system" | "user" | "assistant", "content": "..." }.'
    );
  }
  return value.map((item: unknown) => {
    if (
      typeof item !== 'object' ||
      item === null ||
      !('role' in item) ||
      !isRole(item.role)
    ) {
      throw new Error(
        'The only available roles are: [system, user, assistant]'
      );
    }
    const content = 'content' in item ? item.content : '';
    return {
      role: item.role,
      content: typeof content === 'string' ? content : JSON.stringify(content),
    };
  });
}

function isRole(role: unknown): role is RoleMessage['role'] {
  return role === 'system' || role === 'user' || role === 'assistant';
}

type RoleMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};
