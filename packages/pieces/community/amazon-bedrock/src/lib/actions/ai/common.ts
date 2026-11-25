import { BedrockClient } from '@aws-sdk/client-bedrock';
import { BedrockAgentClient } from '@aws-sdk/client-bedrock-agent';
import { BedrockAgentRuntimeClient } from '@aws-sdk/client-bedrock-agent-runtime';
import {
  BedrockRuntimeClient,
  ConverseCommandInput,
  Message,
  SystemContentBlock,
  ToolConfiguration,
} from '@aws-sdk/client-bedrock-runtime';
import { ServerContext } from '@activepieces/pieces-framework';
import { BedrockAuthProps } from '../../auth';
import { getTemporaryCredentials, isOidcAuth } from '../../common';

async function control({ auth, server }: ClientParams): Promise<BedrockClient> {
  return new BedrockClient(await clientConfig({ auth, server, timeoutMs: CONTROL_TIMEOUT_MS }));
}

async function runtime({ auth, server }: ClientParams): Promise<BedrockRuntimeClient> {
  return new BedrockRuntimeClient(await clientConfig({ auth, server, timeoutMs: INFERENCE_TIMEOUT_MS }));
}

async function agent({ auth, server }: ClientParams): Promise<BedrockAgentClient> {
  return new BedrockAgentClient(await clientConfig({ auth, server, timeoutMs: CONTROL_TIMEOUT_MS }));
}

async function agentRuntime({ auth, server }: ClientParams): Promise<BedrockAgentRuntimeClient> {
  return new BedrockAgentRuntimeClient(await clientConfig({ auth, server, timeoutMs: INFERENCE_TIMEOUT_MS }));
}

function body<T extends { $metadata: unknown }>(response: T): Omit<T, '$metadata'> {
  const { $metadata, ...rest } = response;
  return rest;
}

function clampLimit({ limit, max }: { limit: number | undefined; max: number }): number {
  return Math.min(Math.max(Math.trunc(limit ?? DEFAULT_LIMIT), 1), max);
}

function enumValue<T extends string>({
  value,
  allowed,
  prop,
}: {
  value: string | undefined;
  allowed: Record<string, T>;
  prop: string;
}): T | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const match = Object.values(allowed).find((option) => option === value);
  if (match === undefined) {
    throw new Error(`${prop} must be one of: ${Object.values(allowed).join(', ')}. Got "${value}".`);
  }
  return match;
}

function enumOptions<T extends string>(allowed: Record<string, T>) {
  return { options: Object.values(allowed).map((value) => ({ label: value, value })) };
}

function conversation({
  prompt,
  messages,
}: {
  prompt: string | undefined;
  messages: unknown;
}): Message[] {
  const history = isEmptyJson(messages) ? [] : messages;
  if (!isMessageList(history)) {
    throw new Error(
      'Messages must be a JSON array of Converse messages, each like {"role": "user" | "assistant", "content": [{"text": "..."}]}.',
    );
  }
  return prompt ? [...history, { role: 'user', content: [{ text: prompt }] }] : history;
}

function systemBlocks(system: string | undefined): SystemContentBlock[] | undefined {
  return system ? [{ text: system }] : undefined;
}

function toolConfig(value: unknown): ToolConfiguration | undefined {
  if (isEmptyJson(value)) {
    return undefined;
  }
  if (!isToolConfiguration(value)) {
    throw new Error('Tool Configuration must be a JSON object with a "tools" array, e.g. {"tools": [{"toolSpec": {...}}]}.');
  }
  return value;
}

function document(value: unknown): DocumentType | undefined {
  if (isEmptyJson(value)) {
    return undefined;
  }
  if (!isDocument(value)) {
    throw new Error('Expected a JSON value.');
  }
  return value;
}

function promptTemplate(template: string): { text: string; inputVariables: { name: string }[] } {
  const text = template.replace(SINGLE_BRACE_VARIABLE, '{{$1}}');
  const names = [...text.matchAll(DOUBLE_BRACE_VARIABLE)].map((match) => match[1]);
  return { text, inputVariables: [...new Set(names)].map((name) => ({ name })) };
}

function isEmptyJson(value: unknown): boolean {
  if (value === undefined || value === null || value === '') {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return typeof value === 'object' && Object.keys(value).length === 0;
}

function isMessageList(value: unknown): value is Message[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        'role' in item &&
        (item.role === 'user' || item.role === 'assistant') &&
        'content' in item &&
        Array.isArray(item.content),
    )
  );
}

function isToolConfiguration(value: unknown): value is ToolConfiguration {
  return typeof value === 'object' && value !== null && 'tools' in value && Array.isArray(value.tools);
}

function isDocument(value: unknown): value is DocumentType {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every(isDocument);
  }
  return typeof value === 'object' && Object.values(value).every(isDocument);
}

async function clientConfig({ auth, server, timeoutMs }: ClientParams & { timeoutMs: number }) {
  const credentials = isOidcAuth(auth)
    ? await getTemporaryCredentials({ auth, server })
    : { accessKeyId: auth.accessKeyId, secretAccessKey: auth.secretAccessKey, sessionToken: auth.sessionToken };
  return {
    credentials,
    region: auth.region,
    maxAttempts: 2,
    requestHandler: { requestTimeout: timeoutMs, connectionTimeout: 5_000 },
  };
}

const CONTROL_TIMEOUT_MS = 30_000;
const INFERENCE_TIMEOUT_MS = 180_000;
const DEFAULT_LIMIT = 50;
const SINGLE_BRACE_VARIABLE = /(?<!{){\s*([A-Za-z_][\w-]*)\s*}(?!})/g;
const DOUBLE_BRACE_VARIABLE = /{{\s*([A-Za-z_][\w-]*)\s*}}/g;

export const bedrockAi = {
  control,
  runtime,
  agent,
  agentRuntime,
  body,
  clampLimit,
  enumValue,
  enumOptions,
  conversation,
  systemBlocks,
  toolConfig,
  document,
  promptTemplate,
};

type DocumentType = NonNullable<ConverseCommandInput['additionalModelRequestFields']>;

type ClientParams = { auth: BedrockAuthProps; server: ServerContext };
