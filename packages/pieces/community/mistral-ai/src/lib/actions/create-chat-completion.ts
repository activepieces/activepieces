import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { modelDropdown } from '../common/model-dropdown';

const allowedRoles = ['user', 'assistant', 'system', 'tool'];

function parseMistralError(e: any): string {
  if (e.response?.data?.error) return e.response.data.error;
  if (e.response?.data?.message) return e.response.data.message;
  if (e.message) return e.message;
  return 'Unknown error';
}

export const createChatCompletion = createAction({
  auth: mistralAuth,
  name: 'create_chat_completion',
  displayName: 'Create Chat Completion',
  description: 'Generate conversational text using instructed context and user input.',
  props: {
    model: modelDropdown,
    messages: Property.Array({
      displayName: 'Messages',
      required: true,
      properties: {
        role: Property.StaticDropdown({
          displayName: 'Role',
          required: true,
          options: {
            options: allowedRoles.map((r) => ({ label: r, value: r })),
          },
        }),
        content: Property.LongText({ displayName: 'Content', required: true }),
        name: Property.ShortText({ displayName: 'Name', required: false }),
        tool_call_id: Property.ShortText({ displayName: 'Tool Call ID', required: false }),
      },
    }),
    temperature: Property.Number({ displayName: 'Temperature', required: false, defaultValue: 1 }),
    top_p: Property.Number({ displayName: 'Top P', required: false, defaultValue: 1 }),
    max_tokens: Property.Number({ displayName: 'Max Tokens', required: false }),
    stream: Property.Checkbox({ displayName: 'Stream', required: false, defaultValue: false }),
    safe_prompt: Property.Checkbox({ displayName: 'Safe Prompt', required: false, defaultValue: false }),
    random_seed: Property.Number({ displayName: 'Random Seed', required: false }),
    tools: Property.Array({ displayName: 'Tools', required: false, properties: {} }),
    tool_choice: Property.ShortText({ displayName: 'Tool Choice', required: false }),
    response_format: Property.Object({ displayName: 'Response Format', required: false }),
    timeout: Property.Number({ displayName: 'Timeout (ms)', required: false, defaultValue: 30000 }),
    retries: Property.Number({ displayName: 'Retries', required: false, defaultValue: 2 }),
    responseFormat: Property.StaticDropdown({
      displayName: 'Response Format',
      required: true,
      defaultValue: 'parsed',
      options: {
        options: [
          { label: 'Parsed (JSON)', value: 'parsed' },
          { label: 'Raw (text)', value: 'raw' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { model, messages, temperature, top_p, max_tokens, stream, safe_prompt, random_seed, tools, tool_choice, response_format, timeout, retries, responseFormat } = propsValue;
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('At least one message is required');
    }
    for (const m of messages as Array<{ role: string; content: string }>) {
      if (!allowedRoles.includes(m.role)) {
        throw new Error(`Invalid role: ${m.role}`);
      }
      if (typeof m.content !== 'string' || !m.content.trim()) {
        throw new Error('Message content must be a non-empty string');
      }
    }
    const body: any = {
      model,
      messages,
    };
    if (temperature !== undefined) body.temperature = temperature;
    if (top_p !== undefined) body.top_p = top_p;
    if (max_tokens !== undefined) body.max_tokens = max_tokens;
    if (stream !== undefined) body.stream = stream;
    if (safe_prompt !== undefined) body.safe_prompt = safe_prompt;
    if (random_seed !== undefined) body.random_seed = random_seed;
    if (tools !== undefined) body.tools = tools;
    if (tool_choice !== undefined) body.tool_choice = tool_choice;
    if (response_format !== undefined) body.response_format = response_format;
    let lastErr;
    for (let attempt = 0; attempt <= (retries ?? 2); ++attempt) {
      try {
        const response = await httpClient.sendRequest({
          method: HttpMethod.POST,
          url: 'https://api.mistral.ai/v1/chat/completions',
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth as string,
          },
          body,
          timeout: timeout ?? 30000,
        });
        if (stream) {
          return response.body;
        }
        if (responseFormat === 'raw') {
          return response.body;
        }
        try {
          return typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
        } catch {
          return response.body;
        }
      } catch (e: any) {
        lastErr = e;
        const status = e.response?.status;
        if (status === 429 || (status && status >= 500 && status < 600)) {
          if (attempt < (retries ?? 2)) {
            await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
        }
        throw new Error(parseMistralError(e));
      }
    }
    throw new Error(parseMistralError(lastErr));
  },
}); 