import type { LettaAuthType } from './auth';
import type {
  AgentState,
  BlockResponse,
  ClientOptions,
  IdentityProperty,
  Letta,
  Message,
  Run,
  Tool,
} from './types';

const MISSING_ROUTE_PATTERN = /Cannot (GET|POST|PUT|PATCH|DELETE) ([^<\n]+)/;

async function getLettaClient({ auth }: { auth: LettaAuthType }): Promise<Letta> {
  const { Letta: LettaClient } = await import('@letta-ai/letta-client');
  const clientConfig: ClientOptions = {};
  if (auth.apiKey) {
    clientConfig.apiKey = auth.apiKey;
  }
  if (auth.baseUrl) {
    clientConfig.baseURL = auth.baseUrl;
  }
  return new LettaClient(clientConfig);
}

async function callLetta<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    throw toLettaError(error);
  }
}

function toLettaError(error: unknown): unknown {
  if (!(error instanceof Error)) {
    return error;
  }
  const status = Reflect.get(error, 'status');
  if (typeof status !== 'number') {
    return error;
  }
  const responseBody = Reflect.get(error, 'error') ?? error.message;
  const missingRoute = MISSING_ROUTE_PATTERN.exec(error.message);
  if (status === 404 && missingRoute) {
    return new LettaApiError({
      status,
      message: `This endpoint isn't available on your Letta server (Letta Cloud removed it): ${missingRoute[1]} ${missingRoute[2].trim()}`,
      responseBody,
    });
  }
  return new LettaApiError({
    status,
    message: `Letta API request failed with status ${status}: ${error.message}`,
    responseBody,
  });
}

function requireText({ value, name }: { value: string | undefined | null; name: string }): string {
  const trimmed = (value ?? '').trim();
  if (trimmed.length === 0) {
    throw new Error(`${name} is required.`);
  }
  return trimmed;
}

function optionalText(value: string | undefined | null): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function resolveLimit({ limit, max, fallback, label = 'Limit' }: { limit: number | undefined | null; max: number; fallback: number; label?: string }): number {
  if (limit === undefined || limit === null) {
    return fallback;
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > max) {
    throw new Error(`${label} must be a whole number between 1 and ${max}.`);
  }
  return limit;
}

function resolveYesNo(value: string | undefined | null): boolean | undefined {
  if (value === 'yes') {
    return true;
  }
  if (value === 'no') {
    return false;
  }
  return undefined;
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const items = value
    .map((item) => (typeof item === 'string' ? item.trim() : isRecord(item) ? firstString(Object.values(item)) : undefined))
    .filter((item): item is string => typeof item === 'string' && item.length > 0);
  return items.length > 0 ? items : undefined;
}

function firstString(values: unknown[]): string | undefined {
  const found = values.find((item) => typeof item === 'string' && item.trim().length > 0);
  return typeof found === 'string' ? found.trim() : undefined;
}

function toPage<T>({ items, limit, cursorOf }: { items: T[]; limit: number; cursorOf: (item: T) => string | undefined }): ListPage<T> {
  const hasMore = items.length >= limit;
  const last = items.length > 0 ? items[items.length - 1] : undefined;
  return {
    items,
    count: items.length,
    has_more: hasMore,
    next_cursor: hasMore && last !== undefined ? cursorOf(last) ?? null : null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseIdentityProperties(value: unknown): IdentityProperty[] {
  if (!Array.isArray(value)) {
    throw new Error('Properties must be a list of {key, type, value} objects.');
  }
  return value.map((entry) => {
    if (!isRecord(entry)) {
      throw new Error('Each property must be an object with key, type and value.');
    }
    const key = entry['key'];
    const type = entry['type'];
    if (typeof key !== 'string' || key.trim().length === 0) {
      throw new Error('Each property needs a non-empty key.');
    }
    return parseIdentityProperty({ key: key.trim(), type, value: entry['value'] });
  });
}

function parseIdentityProperty({ key, type, value }: { key: string; type: unknown; value: unknown }): IdentityProperty {
  switch (type) {
    case 'number': {
      const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
      if (!Number.isFinite(parsed)) {
        throw new Error(`Property "${key}" must be a number.`);
      }
      return { key, type, value: parsed };
    }
    case 'boolean': {
      if (typeof value === 'boolean') {
        return { key, type, value };
      }
      const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
      if (normalized === 'true' || normalized === 'yes') {
        return { key, type, value: true };
      }
      if (normalized === 'false' || normalized === 'no') {
        return { key, type, value: false };
      }
      throw new Error(`Property "${key}" must be true or false.`);
    }
    case 'json': {
      if (isRecord(value)) {
        return { key, type, value };
      }
      if (typeof value !== 'string') {
        throw new Error(`Property "${key}" must be a JSON object.`);
      }
      const parsed = parseJsonObject(value);
      if (parsed === undefined) {
        throw new Error(`Property "${key}" must be a valid JSON object.`);
      }
      return { key, type, value: parsed };
    }
    case 'string':
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
        throw new Error(`Property "${key}" must be text.`);
      }
      return { key, type, value: String(value) };
    default:
      throw new Error(`Property "${key}" has an unsupported type. Use string, number, boolean or json.`);
  }
}

function parseJsonObject(text: string): Record<string, unknown> | undefined {
  try {
    const parsed: unknown = JSON.parse(text);
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function contentText(content: unknown): string | null {
  if (typeof content === 'string') {
    return content;
  }
  if (!Array.isArray(content)) {
    return null;
  }
  const parts = content
    .map((part) => (isRecord(part) && typeof part['text'] === 'string' ? part['text'] : undefined))
    .filter((part): part is string => part !== undefined);
  return parts.length > 0 ? parts.join('\n') : null;
}

function mapMessage(message: Message): MappedMessage {
  const base = {
    id: message.id,
    message_type: message.message_type ?? null,
    date: message.date,
    run_id: message.run_id ?? null,
    step_id: message.step_id ?? null,
  };
  if ('content' in message) {
    return { ...base, text: contentText(message.content), tool_name: null, tool_arguments: null, tool_status: null };
  }
  if ('reasoning' in message) {
    return { ...base, text: message.reasoning, tool_name: null, tool_arguments: null, tool_status: null };
  }
  if ('tool_return' in message) {
    return { ...base, text: message.tool_return, tool_name: null, tool_arguments: null, tool_status: message.status };
  }
  if ('tool_call' in message) {
    return {
      ...base,
      text: null,
      tool_name: message.tool_call.name ?? null,
      tool_arguments: message.tool_call.arguments ?? null,
      tool_status: null,
    };
  }
  if ('summary' in message) {
    return { ...base, text: message.summary, tool_name: null, tool_arguments: null, tool_status: null };
  }
  return { ...base, text: null, tool_name: null, tool_arguments: null, tool_status: null };
}

function assistantText(messages: Message[]): string | null {
  const texts = messages
    .filter((message) => message.message_type === 'assistant_message' && 'content' in message)
    .map((message) => ('content' in message ? contentText(message.content) : null))
    .filter((text): text is string => text !== null);
  return texts.length > 0 ? texts.join('\n') : null;
}

function isLettaApiError(error: unknown): error is LettaApiError {
  return error instanceof LettaApiError;
}

function mapAgentSummary(agent: AgentState): MappedAgentSummary {
  return {
    id: agent.id,
    name: agent.name,
    agent_type: agent.agent_type,
    model: agent.model ?? null,
    embedding: agent.embedding ?? null,
    description: agent.description ?? null,
    tags: agent.tags ?? [],
    created_at: agent.created_at ?? null,
    updated_at: agent.updated_at ?? null,
    last_run_completion: agent.last_run_completion ?? null,
    last_stop_reason: agent.last_stop_reason ?? null,
  };
}

function mapAgent(agent: AgentState): MappedAgent {
  return {
    ...mapAgentSummary(agent),
    system: agent.system ?? null,
    blocks: (agent.blocks ?? []).map((block) => ({
      id: block.id ?? null,
      label: block.label ?? null,
      value: block.value,
      limit: block.limit ?? null,
      description: block.description ?? null,
    })),
    tools: (agent.tools ?? []).map(mapToolRef),
    identity_ids: agent.identity_ids ?? [],
  };
}

function mapToolRef(tool: Tool): MappedToolRef {
  return { id: tool.id, name: tool.name ?? null, tool_type: tool.tool_type ?? null };
}

function mapTool(tool: Tool): MappedTool {
  return {
    ...mapToolRef(tool),
    description: tool.description ?? null,
    tags: tool.tags ?? [],
  };
}

function mapBlock(block: BlockResponse): MappedBlock {
  return {
    id: block.id,
    label: block.label ?? null,
    value: block.value,
    limit: block.limit ?? null,
    description: block.description ?? null,
    read_only: block.read_only ?? null,
  };
}

function mapRun(run: Run): MappedRun {
  return {
    id: run.id,
    agent_id: run.agent_id,
    status: run.status ?? null,
    stop_reason: run.stop_reason ?? null,
    created_at: run.created_at ?? null,
    completed_at: run.completed_at ?? null,
    total_duration_ns: run.total_duration_ns ?? null,
  };
}

function mapPassage(value: unknown): MappedPassage | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const text = typeof value['text'] === 'string' ? value['text'] : typeof value['content'] === 'string' ? value['content'] : null;
  const createdAt = typeof value['created_at'] === 'string' ? value['created_at'] : typeof value['timestamp'] === 'string' ? value['timestamp'] : null;
  const tags = Array.isArray(value['tags']) ? value['tags'].filter((tag): tag is string => typeof tag === 'string') : [];
  return {
    id: typeof value['id'] === 'string' ? value['id'] : null,
    text,
    tags,
    created_at: createdAt,
  };
}

function mapPassages(value: unknown): MappedPassage[] {
  const list = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value['results'])
      ? value['results']
      : isRecord(value)
        ? [value]
        : [];
  return list.map(mapPassage).filter((item): item is MappedPassage => item !== undefined);
}

function agentPath(agentId: string): string {
  return `/v1/agents/${encodeURIComponent(agentId)}`;
}

class LettaApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;
  constructor({ status, message, responseBody }: { status: number; message: string; responseBody: unknown }) {
    super(message);
    this.name = 'LettaApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export const lettaApi = {
  getLettaClient,
  callLetta,
  requireText,
  optionalText,
  resolveLimit,
  resolveYesNo,
  toStringArray,
  toPage,
  parseIdentityProperties,
  parseIdentityProperty,
  assistantText,
  mapMessage,
  mapAgentSummary,
  mapAgent,
  mapToolRef,
  mapTool,
  mapBlock,
  mapRun,
  mapPassages,
  agentPath,
  isLettaApiError,
  isRecord,
};

export { LettaApiError };

export type ListPage<T> = {
  items: T[];
  count: number;
  has_more: boolean;
  next_cursor: string | null;
};

export type MappedMessage = {
  id: string;
  message_type: string | null;
  date: string;
  run_id: string | null;
  step_id: string | null;
  text: string | null;
  tool_name: string | null;
  tool_arguments: string | null;
  tool_status: string | null;
};

export type MappedAgentSummary = {
  id: string;
  name: string;
  agent_type: string;
  model: string | null;
  embedding: string | null;
  description: string | null;
  tags: string[];
  created_at: string | null;
  updated_at: string | null;
  last_run_completion: string | null;
  last_stop_reason: string | null;
};

export type MappedAgent = MappedAgentSummary & {
  system: string | null;
  blocks: Array<{ id: string | null; label: string | null; value: string; limit: number | null; description: string | null }>;
  tools: MappedToolRef[];
  identity_ids: string[];
};

export type MappedToolRef = { id: string; name: string | null; tool_type: string | null };

export type MappedTool = MappedToolRef & { description: string | null; tags: string[] };

export type MappedBlock = {
  id: string;
  label: string | null;
  value: string;
  limit: number | null;
  description: string | null;
  read_only: boolean | null;
};

export type MappedRun = {
  id: string;
  agent_id: string;
  status: string | null;
  stop_reason: string | null;
  created_at: string | null;
  completed_at: string | null;
  total_duration_ns: number | null;
};

export type MappedPassage = {
  id: string | null;
  text: string | null;
  tags: string[];
  created_at: string | null;
};
