import {
  buildAuthHeaders,
  McpAuthConfig,
  McpAuthType,
  McpProtocol,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { mcpClientAuth } from '../auth';

async function connect(auth: McpClientAuthValue): Promise<Client> {
  const headers = buildAuthHeaders(toAuthConfig(auth));
  const url = new URL(auth.serverUrl);

  // ponytail: Streamable HTTP transport also serves plain-JSON ("HTTP") servers,
  // so both HTTP variants share it; only legacy SSE needs its own transport.
  const transport =
    auth.protocol === McpProtocol.SSE
      ? new SSEClientTransport(url, { requestInit: { headers } })
      : new StreamableHTTPClientTransport(url, { requestInit: { headers } });

  const client = new Client({ name: 'activepieces-mcp-client', version: '1.0.0' });
  await client.connect(transport);
  return client;
}

async function listTools(auth: McpClientAuthValue): Promise<McpToolInfo[]> {
  const client = await connect(auth);
  try {
    const { tools } = await client.listTools();
    return tools;
  } finally {
    await client.close();
  }
}

function toAuthConfig(auth: McpClientAuthValue): McpAuthConfig {
  switch (auth.authType) {
    case McpAuthType.ACCESS_TOKEN:
      return { type: McpAuthType.ACCESS_TOKEN, accessToken: auth.accessToken ?? '' };
    case McpAuthType.API_KEY:
      return {
        type: McpAuthType.API_KEY,
        apiKey: auth.apiKey ?? '',
        apiKeyHeader: auth.apiKeyHeader ?? '',
      };
    case McpAuthType.HEADERS:
      return { type: McpAuthType.HEADERS, headers: parseHeaders(auth.headers) };
    default:
      return { type: McpAuthType.NONE };
  }
}

function parseHeaders(raw: string | undefined): Record<string, string> {
  if (!raw || raw.trim().length === 0) {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Custom Headers must be a valid JSON object of header name/value pairs.');
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Custom Headers must be a valid JSON object of header name/value pairs.');
  }
  return Object.fromEntries(
    Object.entries(parsed as Record<string, unknown>).map(([key, value]) => [key, String(value)]),
  );
}

export const mcpClient = { connect, listTools };

export type McpClientAuthValue = PiecePropValueSchema<typeof mcpClientAuth>;
export type McpToolInfo = Awaited<ReturnType<Client['listTools']>>['tools'][number];
