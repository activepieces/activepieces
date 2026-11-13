import {
  AppConnectionType,
  AppConnectionValueForAuthProperty,
  buildAuthHeaders,
  McpAuthConfig,
  McpAuthType,
  McpProtocol,
} from '@activepieces/pieces-framework';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { mcpAuth } from '../auth';

async function connect(auth: McpClientAuthValue): Promise<Client> {
  const headers = buildAuthHeaders(toAuthConfig(auth));
  const { serverUrl, protocol } = resolveServerConfig(auth);
  const url = new URL(serverUrl);

  // ponytail: Streamable HTTP transport also serves plain-JSON ("HTTP") servers,
  // so both HTTP variants share it; only legacy SSE needs its own transport.
  const transport =
    protocol === McpProtocol.SSE
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
  if (auth.type === AppConnectionType.OAUTH2) {
    return { type: McpAuthType.ACCESS_TOKEN, accessToken: auth.access_token };
  }
  switch (auth.props.authType) {
    case McpAuthType.ACCESS_TOKEN:
      return { type: McpAuthType.ACCESS_TOKEN, accessToken: auth.props.accessToken ?? '' };
    case McpAuthType.API_KEY:
      return {
        type: McpAuthType.API_KEY,
        apiKey: auth.props.apiKey ?? '',
        apiKeyHeader: auth.props.apiKeyHeader ?? '',
      };
    case McpAuthType.HEADERS:
      return { type: McpAuthType.HEADERS, headers: parseHeaders(auth.props.headers) };
    default:
      return { type: McpAuthType.NONE };
  }
}

function resolveServerConfig(auth: McpClientAuthValue): { serverUrl: string; protocol: McpProtocol } {
  if (auth.type !== AppConnectionType.OAUTH2) {
    return { serverUrl: auth.props.serverUrl, protocol: auth.props.protocol };
  }
  // The OAuth2 connection value's own `props` is framework-typed as an untyped bag
  // (`BaseOAuth2ConnectionValue.props?: Record<string, unknown>`), so narrow by hand.
  const serverUrl = auth.props?.['serverUrl'];
  const protocol = auth.props?.['protocol'];
  if (typeof serverUrl !== 'string') {
    throw new Error('OAuth2 connection is missing the MCP Server URL.');
  }
  return {
    serverUrl,
    protocol: protocol === McpProtocol.SSE || protocol === McpProtocol.SIMPLE_HTTP ? protocol : McpProtocol.STREAMABLE_HTTP,
  };
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

export type McpClientAuthValue = AppConnectionValueForAuthProperty<typeof mcpAuth>;
export type McpToolInfo = Awaited<ReturnType<Client['listTools']>>['tools'][number];
