import { AgentToolType, McpAuthType, McpProtocol } from '@activepieces/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { validateAgentMcpTool } from './validate-mcp-tool';

describe('validateAgentMcpTool', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('SIMPLE_HTTP — returns tool names from a JSON tools/list response', async () => {
    const fetchSpy = mockJsonRpcServer({
      tools: [{ name: 'search' }, { name: 'fetch' }],
    });

    const result = await validateAgentMcpTool(
      buildTool({ protocol: McpProtocol.SIMPLE_HTTP }),
    );

    expect(result.error).toBeUndefined();
    expect(result.toolNames).toEqual(['search', 'fetch']);

    const toolsListCall = findCallWithMethod(fetchSpy, 'tools/list');
    expect(toolsListCall).toBeDefined();
    expect(toolsListCall!.init.method).toBe('POST');
    const headers = toolsListCall!.headers;
    expect(headers['content-type']).toBe('application/json');
    expect(headers['accept']).toBe('application/json');
  });

  it('STREAMABLE_HTTP — parses a plain JSON response without routing into the SSE parser', async () => {
    const fetchSpy = mockJsonRpcServer({
      tools: [{ name: 'alpha' }],
    });

    const result = await validateAgentMcpTool(
      buildTool({ protocol: McpProtocol.STREAMABLE_HTTP }),
    );

    expect(result.error).toBeUndefined();
    expect(result.toolNames).toEqual(['alpha']);

    const toolsListCall = findCallWithMethod(fetchSpy, 'tools/list');
    expect(toolsListCall!.headers['accept']).toBe(
      'application/json, text/event-stream',
    );
  });

  it('STREAMABLE_HTTP — parses an SSE response body', async () => {
    mockJsonRpcServer(
      {
        tools: [{ name: 'streamed' }],
      },
      { forceSse: true },
    );

    const result = await validateAgentMcpTool(
      buildTool({ protocol: McpProtocol.STREAMABLE_HTTP }),
    );

    expect(result.error).toBeUndefined();
    expect(result.toolNames).toEqual(['streamed']);
  });

  it('SSE — returns tool names via POST + SSE stream', async () => {
    const fetchSpy = mockJsonRpcServer(
      {
        tools: [{ name: 'one' }, { name: 'two' }],
      },
      { forceSse: true },
    );

    const result = await validateAgentMcpTool(
      buildTool({ protocol: McpProtocol.SSE }),
    );

    expect(result.error).toBeUndefined();
    expect(result.toolNames).toEqual(['one', 'two']);

    const calls = parseCalls(fetchSpy);
    expect(calls[0].body.method).toBe('initialize');
    expect(calls[1].body.method).toBe('tools/list');
    expect(calls[0].headers['accept']).toBe('text/event-stream');
  });

  describe('auth header mapping', () => {
    it('McpAuthType.NONE sends no auth headers', async () => {
      const fetchSpy = mockJsonRpcServer({ tools: [] });
      await validateAgentMcpTool(
        buildTool({
          protocol: McpProtocol.SIMPLE_HTTP,
          auth: { type: McpAuthType.NONE },
        }),
      );
      const headers = parseCalls(fetchSpy)[0].headers;
      expect(headers['authorization']).toBeUndefined();
      expect(headers['x-api-key']).toBeUndefined();
    });

    it('McpAuthType.API_KEY sends the configured header', async () => {
      const fetchSpy = mockJsonRpcServer({ tools: [] });
      await validateAgentMcpTool(
        buildTool({
          protocol: McpProtocol.SIMPLE_HTTP,
          auth: {
            type: McpAuthType.API_KEY,
            apiKey: 'secret-123',
            apiKeyHeader: 'X-API-Key',
          },
        }),
      );
      const headers = parseCalls(fetchSpy)[0].headers;
      expect(headers['x-api-key']).toBe('secret-123');
    });

    it('McpAuthType.ACCESS_TOKEN sends a Bearer Authorization header', async () => {
      const fetchSpy = mockJsonRpcServer({ tools: [] });
      await validateAgentMcpTool(
        buildTool({
          protocol: McpProtocol.SIMPLE_HTTP,
          auth: {
            type: McpAuthType.ACCESS_TOKEN,
            accessToken: 'tok-abc',
          },
        }),
      );
      const headers = parseCalls(fetchSpy)[0].headers;
      expect(headers['authorization']).toBe('Bearer tok-abc');
    });

    it('McpAuthType.HEADERS forwards each configured header', async () => {
      const fetchSpy = mockJsonRpcServer({ tools: [] });
      await validateAgentMcpTool(
        buildTool({
          protocol: McpProtocol.SIMPLE_HTTP,
          auth: {
            type: McpAuthType.HEADERS,
            headers: {
              'X-Custom-Auth': 'hello',
              'X-Tenant': 'acme',
            },
          },
        }),
      );
      const headers = parseCalls(fetchSpy)[0].headers;
      expect(headers['x-custom-auth']).toBe('hello');
      expect(headers['x-tenant']).toBe('acme');
    });
  });

  it('returns a CORS-hint error when fetch throws a TypeError', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(
      new TypeError('Failed to fetch'),
    );

    const result = await validateAgentMcpTool(
      buildTool({ protocol: McpProtocol.SIMPLE_HTTP }),
    );

    expect(result.toolNames).toBeUndefined();
    expect(result.error).toBe(
      'Could not reach MCP server. If the server is remote, it must allow CORS from this origin.',
    );
  });

  it('surfaces a JSON-RPC error from the MCP server', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      const body = JSON.parse(String((init as RequestInit).body));
      return jsonResponse({
        jsonrpc: '2.0',
        id: body.id,
        error: { code: -32601, message: 'Method not found' },
      });
    });

    const result = await validateAgentMcpTool(
      buildTool({ protocol: McpProtocol.SIMPLE_HTTP }),
    );

    expect(result.toolNames).toBeUndefined();
    expect(result.error).toContain('Method not found');
    expect(result.error).toContain('-32601');
  });

  it('reports HTTP non-2xx responses with the status code', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('unauthorized', {
        status: 401,
        statusText: 'Unauthorized',
      }),
    );

    const result = await validateAgentMcpTool(
      buildTool({ protocol: McpProtocol.SIMPLE_HTTP }),
    );

    expect(result.toolNames).toBeUndefined();
    expect(result.error).toContain('401');
  });

  it('reports a timeout when the MCP server never responds', async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          const signal = (init as RequestInit | undefined)?.signal;
          signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    );

    const pending = validateAgentMcpTool(
      buildTool({ protocol: McpProtocol.SIMPLE_HTTP }),
    );
    await vi.advanceTimersByTimeAsync(20_000);
    const result = await pending;

    expect(result.toolNames).toBeUndefined();
    expect(result.error).toMatch(/timed out/i);
  });

  it('rejects a malformed URL without calling fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const result = await validateAgentMcpTool(
      buildTool({
        protocol: McpProtocol.SIMPLE_HTTP,
        serverUrl: 'not a url',
      }),
    );

    expect(result.toolNames).toBeUndefined();
    expect(result.error).toBe('Invalid server URL');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects unknown protocols with a structured error', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const tool = buildTool({ protocol: McpProtocol.SIMPLE_HTTP });
    const forcedUnknownProtocol = { ...tool, protocol: 'ftp' as McpProtocol };

    const result = await validateAgentMcpTool(forcedUnknownProtocol);

    expect(result.toolNames).toBeUndefined();
    expect(result.error).toContain('Unsupported MCP protocol');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

function buildTool(
  overrides: Partial<ReturnType<typeof defaultTool>> = {},
): ReturnType<typeof defaultTool> {
  return { ...defaultTool(), ...overrides };
}

function defaultTool() {
  return {
    type: AgentToolType.MCP,
    toolName: 'unit-test',
    serverUrl: 'https://mcp.example.com/rpc',
    protocol: McpProtocol.SIMPLE_HTTP,
    auth: { type: McpAuthType.NONE },
  } as const;
}

function mockJsonRpcServer(
  { tools }: { tools: Array<{ name: string }> },
  { forceSse = false }: { forceSse?: boolean } = {},
) {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (_input, init) => {
      const body = JSON.parse(String((init as RequestInit).body));
      if (body.method === 'initialize') {
        const payload = {
          jsonrpc: '2.0',
          id: body.id,
          result: {
            protocolVersion: '2025-03-26',
            serverInfo: { name: 'mock', version: '0' },
            capabilities: { tools: {} },
          },
        };
        return forceSse ? sseResponse([payload]) : jsonResponse(payload);
      }
      if (body.method === 'tools/list') {
        const payload = {
          jsonrpc: '2.0',
          id: body.id,
          result: { tools },
        };
        return forceSse ? sseResponse([payload]) : jsonResponse(payload);
      }
      return new Response('', { status: 404 });
    });
}

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function sseResponse(messages: unknown[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const message of messages) {
        controller.enqueue(
          encoder.encode(
            `event: message\ndata: ${JSON.stringify(message)}\n\n`,
          ),
        );
      }
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { 'content-type': 'text/event-stream' },
  });
}

function parseCalls(fetchSpy: FetchSpy): ParsedCall[] {
  return fetchSpy.mock.calls.map(([input, init]) => {
    const url = typeof input === 'string' ? input : input.toString();
    const headers = normalizeHeaders(init?.headers);
    const rawBody = (init as RequestInit | undefined)?.body;
    const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    return { url, init: init ?? {}, headers, body };
  });
}

function findCallWithMethod(
  fetchSpy: FetchSpy,
  method: string,
): ParsedCall | undefined {
  return parseCalls(fetchSpy).find(
    (call) => call.body && call.body.method === method,
  );
}

function normalizeHeaders(
  headers: HeadersInit | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!headers) {
    return out;
  }
  const iterable =
    headers instanceof Headers
      ? Array.from(headers.entries())
      : Array.isArray(headers)
      ? headers
      : Object.entries(headers);
  for (const [key, value] of iterable) {
    out[key.toLowerCase()] = value;
  }
  return out;
}

type FetchSpy = ReturnType<typeof vi.spyOn<typeof globalThis, 'fetch'>>;

type ParsedCall = {
  url: string;
  init: RequestInit;
  headers: Record<string, string>;
  body: { jsonrpc?: string; id?: number | string; method?: string } | unknown;
};
