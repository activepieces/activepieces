import {
  AgentMcpTool,
  buildAuthHeaders,
  McpProtocol,
  ValidateAgentMcpToolResponse,
} from '@activepieces/shared';

export async function validateAgentMcpTool(
  request: AgentMcpTool,
): Promise<ValidateAgentMcpToolResponse> {
  if (!isValidUrl(request.serverUrl)) {
    return { toolNames: undefined, error: 'Invalid server URL' };
  }

  const controller = new AbortController();
  const timeoutHandle = setTimeout(
    () => controller.abort(),
    VALIDATE_TIMEOUT_MS,
  );

  try {
    const authHeaders = buildAuthHeaders(request.auth);
    const toolNames = await probeMcpServer({
      protocol: request.protocol,
      serverUrl: request.serverUrl,
      authHeaders,
      signal: controller.signal,
    });
    return { toolNames, error: undefined };
  } catch (error) {
    return {
      toolNames: undefined,
      error: mapErrorMessage({ error, signal: controller.signal }),
    };
  } finally {
    clearTimeout(timeoutHandle);
  }
}

async function probeMcpServer({
  protocol,
  serverUrl,
  authHeaders,
  signal,
}: {
  protocol: McpProtocol;
  serverUrl: string;
  authHeaders: Record<string, string>;
  signal: AbortSignal;
}): Promise<string[]> {
  switch (protocol) {
    case McpProtocol.SIMPLE_HTTP:
      return listToolsViaPost({
        serverUrl,
        authHeaders,
        signal,
        accept: 'application/json',
      });
    case McpProtocol.STREAMABLE_HTTP:
      return listToolsViaPost({
        serverUrl,
        authHeaders,
        signal,
        accept: 'application/json, text/event-stream',
      });
    case McpProtocol.SSE:
      return listToolsViaPost({
        serverUrl,
        authHeaders,
        signal,
        accept: 'text/event-stream',
      });
    default:
      throw new Error(`Unsupported MCP protocol: ${String(protocol)}`);
  }
}

async function listToolsViaPost({
  serverUrl,
  authHeaders,
  signal,
  accept,
}: {
  serverUrl: string;
  authHeaders: Record<string, string>;
  signal: AbortSignal;
  accept: string;
}): Promise<string[]> {
  const initResult = await sendJsonRpc({
    url: serverUrl,
    headers: authHeaders,
    accept,
    signal,
    body: {
      jsonrpc: '2.0',
      id: INITIALIZE_ID,
      method: 'initialize',
      params: {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: MCP_CLIENT_INFO,
      },
    },
  });

  const sessionHeaders: Record<string, string> = initResult.sessionId
    ? { ...authHeaders, 'Mcp-Session-Id': initResult.sessionId }
    : authHeaders;

  const toolsResult = await sendJsonRpc({
    url: serverUrl,
    headers: sessionHeaders,
    accept,
    signal,
    body: {
      jsonrpc: '2.0',
      id: TOOLS_LIST_ID,
      method: 'tools/list',
      params: {},
    },
  });

  return extractToolNames(toolsResult.message);
}

async function sendJsonRpc({
  url,
  headers,
  accept,
  body,
  signal,
}: {
  url: string;
  headers: Record<string, string>;
  accept: string;
  body: JsonRpcRequest;
  signal: AbortSignal;
}): Promise<{ message: JsonRpcResponse; sessionId: string | null }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: accept,
      ...headers,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `MCP server returned ${response.status}${
        response.statusText ? ` ${response.statusText}` : ''
      }`,
    );
  }

  const sessionId = response.headers.get('mcp-session-id');
  const contentType = (
    response.headers.get('content-type') ?? ''
  ).toLowerCase();

  if (contentType.includes('text/event-stream')) {
    const message = await readFirstMatchingJsonRpcFromSse({
      response,
      matchId: body.id,
    });
    return { message, sessionId };
  }

  const payload: unknown = await response.json();
  if (!isJsonRpcResponse(payload)) {
    throw new Error('MCP server returned a malformed JSON-RPC response');
  }
  return { message: payload, sessionId };
}

async function readFirstMatchingJsonRpcFromSse({
  response,
  matchId,
}: {
  response: Response;
  matchId: number | string;
}): Promise<JsonRpcResponse> {
  if (!response.body) {
    throw new Error('MCP SSE response has no body');
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (value) {
        buffer += value;
      }
      const { events, remainder } = splitSseEvents(buffer);
      buffer = remainder;
      for (const event of events) {
        const parsed = parseJsonRpc(event);
        if (parsed && parsed.id === matchId) {
          return parsed;
        }
      }
      if (done) {
        throw new Error('MCP SSE stream ended before a response was received');
      }
    }
  } finally {
    reader.cancel().catch(() => {
      /* ignore */
    });
  }
}

function splitSseEvents(buffer: string): {
  events: string[];
  remainder: string;
} {
  const events: string[] = [];
  const parts = buffer.split(/\r?\n\r?\n/);
  const remainder = parts.pop() ?? '';
  for (const part of parts) {
    const dataLines = part
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice('data:'.length).replace(/^ /, ''));
    if (dataLines.length > 0) {
      events.push(dataLines.join('\n'));
    }
  }
  return { events, remainder };
}

function parseJsonRpc(raw: string): JsonRpcResponse | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isJsonRpcResponse(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isJsonRpcResponse(value: unknown): value is JsonRpcResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'jsonrpc' in value &&
    value.jsonrpc === '2.0'
  );
}

function extractToolNames(message: JsonRpcResponse): string[] {
  if (message.error) {
    const code =
      typeof message.error.code === 'number' ? ` (${message.error.code})` : '';
    throw new Error(
      `MCP server rejected tools/list${code}: ${
        message.error.message ?? 'unknown error'
      }`,
    );
  }
  const result = message.result;
  if (
    typeof result !== 'object' ||
    result === null ||
    !('tools' in result) ||
    !Array.isArray(result.tools)
  ) {
    throw new Error('MCP server response is missing a tools array');
  }
  const names: string[] = [];
  for (const tool of result.tools) {
    if (
      typeof tool === 'object' &&
      tool !== null &&
      'name' in tool &&
      typeof tool.name === 'string'
    ) {
      names.push(tool.name);
    }
  }
  return names;
}

function mapErrorMessage({
  error,
  signal,
}: {
  error: unknown;
  signal: AbortSignal;
}): string {
  if (signal.aborted) {
    return `Validation timed out after ${VALIDATE_TIMEOUT_MS / 1000}s`;
  }
  if (error instanceof TypeError) {
    return 'Could not reach MCP server. If the server is remote, it must allow CORS from this origin.';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const VALIDATE_TIMEOUT_MS = 15_000;
const MCP_PROTOCOL_VERSION = '2025-03-26';
const MCP_CLIENT_INFO = {
  name: 'activepieces-browser-validator',
  version: '1.0.0',
};
const INITIALIZE_ID = 1;
const TOOLS_LIST_ID = 2;

type JsonRpcRequest = {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: unknown;
};

type JsonRpcResponse = {
  jsonrpc: '2.0';
  id?: number | string;
  result?: unknown;
  error?: { code?: number; message?: string; data?: unknown };
};
