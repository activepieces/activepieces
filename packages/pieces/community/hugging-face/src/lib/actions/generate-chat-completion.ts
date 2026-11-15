import { createAction, Property } from '@activepieces/pieces-framework';
import { InferenceClient } from '@huggingface/inference';
import type { ChatCompletionInput, ChatCompletionInputMessage } from '@huggingface/tasks';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfInference } from '../common/inference';
import { hfUtils } from '../common/utils';
import { generateChatCompletionOutputSchema } from '../output-schemas';

const DEFAULT_CHAT_MODEL = 'openai/gpt-oss-20b';

export const generateChatCompletion = createAction({
  auth: huggingFaceAuth,
  name: 'generate_chat_completion',
  classification: 'READ',
  displayName: 'Generate Chat Completion',
  description: 'Generate an assistant reply from a list of chat messages with a model served by Inference Providers.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Runs one OpenAI-style chat completion on a Hugging Face model served by Inference Providers and returns the assistant reply, finish reason and token usage. Use it for open-ended generation, reasoning or structured JSON output (set Response Format); prefer text_summarization, language_translation or text_classification for those narrower tasks. Reasoning models such as openai/gpt-oss-20b spend part of max_tokens on hidden reasoning, so an empty content with finish_reason 'length' means max_tokens must be raised to a few hundred or more. Each call spends the account's Inference Providers credits (free monthly allowance, then pay-as-you-go) and sampled output varies between runs, so it is not idempotent.",
    idempotent: false,
  },
  outputSchema: generateChatCompletionOutputSchema,
  props: {
    model: Property.ShortText({
      displayName: 'Model',
      description:
        "Model ID served by Inference Providers, for example 'openai/gpt-oss-20b' or 'Qwen/Qwen3-8B'. Find others with Search Models (pipeline_tag 'text-generation', inference_provider 'all'); append ':<provider>' (for example ':groq') or ':preferred' to pick the provider. Leave empty to use openai/gpt-oss-20b.",
      required: false,
      defaultValue: DEFAULT_CHAT_MODEL,
    }),
    provider: hfInference.providerProp(),
    messages: Property.Json({
      displayName: 'Messages',
      description:
        'The conversation as a JSON array of {"role", "content"} objects, oldest first, for example [{"role": "user", "content": "Summarize this in one line: ..."}]. Roles are system, user and assistant. For vision models, content may be an array of parts such as {"type": "text", "text": "..."} and {"type": "image_url", "image_url": {"url": "https://..."}}.',
      required: true,
    }),
    system_prompt: Property.LongText({
      displayName: 'System Prompt',
      description: 'Optional instructions sent as a leading system message. Nothing is added when empty.',
      required: false,
    }),
    max_tokens: Property.Number({
      displayName: 'Max Tokens',
      description:
        "Maximum number of tokens to generate in the reply, for example 512. Reasoning models such as openai/gpt-oss-20b spend part of this on hidden reasoning, so an empty reply with finish_reason 'length' means you should raise it to a few hundred or more.",
      required: false,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'Sampling temperature between 0 and 2. 0 is the most deterministic. Leave empty for the model default.',
      required: false,
    }),
    top_p: Property.Number({
      displayName: 'Top P',
      description: 'Nucleus sampling probability mass between 0 and 1, for example 0.9. Leave empty for the model default.',
      required: false,
    }),
    stop: Property.Array({
      displayName: 'Stop Sequences',
      description: 'Up to 4 text sequences at which generation stops.',
      required: false,
    }),
    seed: Property.Number({
      displayName: 'Seed',
      description: 'Random seed for more repeatable sampling, where the provider supports it.',
      required: false,
    }),
    response_format: Property.StaticDropdown({
      displayName: 'Response Format',
      description: "'json_object' forces valid JSON; 'json_schema' forces JSON matching the JSON Schema field. Defaults to plain text.",
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Text', value: 'text' },
          { label: 'JSON Object', value: 'json_object' },
          { label: 'JSON Schema', value: 'json_schema' },
        ],
      },
    }),
    json_schema: Property.Json({
      displayName: 'JSON Schema',
      description:
        'Required when Response Format is json_schema: {"name": "answer", "schema": {...JSON Schema...}, "strict": true}. A bare JSON Schema object is also accepted.',
      required: false,
    }),
  },
  async run(context) {
    const {
      model,
      provider,
      messages,
      system_prompt,
      max_tokens,
      temperature,
      top_p,
      stop,
      seed,
      response_format,
      json_schema,
    } = context.propsValue;
    const resolved = hfInference.resolveModelAndProvider({ model, provider, defaultModel: DEFAULT_CHAT_MODEL });
    const conversation = parseMessages(messages);
    const systemText = system_prompt?.trim();
    const allMessages: ChatCompletionInputMessage[] = systemText
      ? [{ role: 'system', content: systemText }, ...conversation]
      : conversation;
    const stopSequences = hfUtils.toStringArray(stop);
    if (stopSequences.length > 4) {
      throw new Error('Provide at most 4 stop sequences.');
    }
    const args: ChatCompletionInput = {
      model: resolved.model,
      messages: allMessages,
      stream: false,
      ...(max_tokens !== undefined ? { max_tokens } : {}),
      ...(temperature !== undefined ? { temperature } : {}),
      ...(top_p !== undefined ? { top_p } : {}),
      ...(seed !== undefined ? { seed } : {}),
      ...(stopSequences.length > 0 ? { stop: stopSequences } : {}),
      ...buildResponseFormat({ format: response_format, schema: json_schema }),
    };
    const client = new InferenceClient(context.auth.secret_text);
    try {
      const result = await client.chatCompletion({ ...args, provider: resolved.provider });
      const choice = result.choices?.[0];
      return {
        content: choice?.message?.content ?? null,
        finish_reason: choice?.finish_reason ?? null,
        model: result.model ?? resolved.model,
        id: result.id ?? null,
        usage: {
          prompt_tokens: result.usage?.prompt_tokens ?? null,
          completion_tokens: result.usage?.completion_tokens ?? null,
          total_tokens: result.usage?.total_tokens ?? null,
        },
      };
    } catch (error) {
      throw hfInference.toError(error);
    }
  },
});

function parseMessages(value: unknown): ChatCompletionInputMessage[] {
  const raw: unknown = typeof value === 'string' ? parseJson(value) : value;
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error('Messages must be a non-empty JSON array of {"role", "content"} objects.');
  }
  return raw.map((item: unknown, index) => {
    if (!hfHub.isRecord(item) || typeof item['role'] !== 'string') {
      throw new Error(`Message ${index + 1} must be an object with a string "role".`);
    }
    const role = item['role'];
    const content = item['content'];
    if (typeof content === 'string') {
      return { role, content };
    }
    if (Array.isArray(content)) {
      return { role, content: content.map((part: unknown) => parseContentPart({ part, index })) };
    }
    throw new Error(`Message ${index + 1} needs "content" as a string or an array of content parts.`);
  });
}

function parseContentPart({ part, index }: ParseContentPartParams): MessageChunk {
  if (hfHub.isRecord(part) && part['type'] === 'text' && typeof part['text'] === 'string') {
    return { type: 'text', text: part['text'] };
  }
  if (hfHub.isRecord(part) && part['type'] === 'image_url') {
    const imageUrl = part['image_url'];
    const url = hfHub.isRecord(imageUrl) ? imageUrl['url'] : imageUrl;
    if (typeof url === 'string') {
      return { type: 'image_url', image_url: { url } };
    }
  }
  throw new Error(
    `Message ${index + 1} has an invalid content part. Use {"type": "text", "text": "..."} or {"type": "image_url", "image_url": {"url": "..."}}.`
  );
}

function buildResponseFormat({ format, schema }: BuildResponseFormatParams): {
  response_format?: ResponseFormat;
} {
  switch (format) {
    case undefined:
    case 'text':
      return {};
    case 'json_object':
      return { response_format: { type: 'json_object' } };
    case 'json_schema': {
      const raw: unknown = typeof schema === 'string' ? parseJson(schema) : schema;
      if (!hfHub.isRecord(raw)) {
        throw new Error('JSON Schema is required when Response Format is json_schema.');
      }
      const inner = raw['schema'];
      const name = raw['name'];
      const strict = raw['strict'];
      if (hfHub.isRecord(inner)) {
        return {
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: typeof name === 'string' ? name : 'response',
              schema: inner,
              ...(typeof strict === 'boolean' ? { strict } : {}),
            },
          },
        };
      }
      return { response_format: { type: 'json_schema', json_schema: { name: 'response', schema: raw } } };
    }
    default:
      throw new Error(`Unknown Response Format '${format}'. Use text, json_object or json_schema.`);
  }
}

function parseJson(text: string): unknown {
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed;
  } catch {
    throw new Error('Expected valid JSON.');
  }
}

type ParseContentPartParams = {
  part: unknown;
  index: number;
};

type BuildResponseFormatParams = {
  format: string | undefined;
  schema: unknown;
};

type ResponseFormat = NonNullable<ChatCompletionInput['response_format']>;

type MessageChunk = Extract<NonNullable<ChatCompletionInputMessage['content']>, unknown[]>[number];
