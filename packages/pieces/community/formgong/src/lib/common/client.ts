import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { createHmac, timingSafeEqual } from 'crypto';

export const FORMGONG_BASE_URL = 'https://formgong.com';

// Every Formgong operation is a tool on its MCP endpoint: one JSON-RPC `tools/call` per request.
async function callTool<T>({
  token,
  tool,
  args = {},
}: {
  token: string;
  tool: string;
  args?: Record<string, unknown>;
}): Promise<T> {
  let body: McpResponse;
  try {
    const response = await httpClient.sendRequest<McpResponse>({
      method: HttpMethod.POST,
      url: `${FORMGONG_BASE_URL}/mcp`,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: tool, arguments: args },
      },
    });
    body = response.body;
  } catch (error) {
    throw readableError(error);
  }
  if (body.error) {
    throw new Error(`Formgong: ${body.error.message}`);
  }
  const text = body.result?.content?.find((part) => part.type === 'text')?.text;
  if (!body.result || body.result.isError) {
    throw new Error(`Formgong ${tool} failed: ${text ?? 'empty response'}`);
  }
  return (body.result.structuredContent ?? JSON.parse(text ?? '{}')) as T;
}

function readableError(error: unknown): Error {
  if (!(error instanceof HttpError)) {
    return error instanceof Error ? error : new Error(String(error));
  }
  const status = error.response.status;
  if (status === 401) {
    return new Error(
      'Formgong rejected the API token (HTTP 401). Create a new one in Formgong under Dashboard → Account → API tokens.'
    );
  }
  const responseBody = error.response.body;
  const message =
    typeof responseBody === 'object' &&
    responseBody !== null &&
    'error' in responseBody
      ? (responseBody as McpResponse).error?.message
      : undefined;
  return new Error(
    `Formgong answered HTTP ${status}${message ? `: ${message}` : ''}`
  );
}

// Formgong signs each delivery: X-Signature: sha256=<hex HMAC-SHA256 of the raw body, keyed with the form's signing secret>.
function isValidSignature({
  rawBody,
  signature,
  secret,
}: {
  rawBody: unknown;
  signature: string | undefined;
  secret: string | undefined;
}): boolean {
  const match = /^sha256=([a-f0-9]{64})$/i.exec(signature?.trim() ?? '');
  if (
    !match ||
    !secret ||
    !(typeof rawBody === 'string' || Buffer.isBuffer(rawBody))
  ) {
    return false;
  }
  const expected = createHmac('sha256', secret).update(rawBody).digest();
  return timingSafeEqual(Buffer.from(match[1], 'hex'), expected);
}

export const formgongApi = { callTool, isValidSignature };

type McpResponse = {
  result?: {
    content?: { type: string; text?: string }[];
    structuredContent?: unknown;
    isError?: boolean;
  };
  error?: { code: number; message: string };
};

export type FormgongForm = {
  id: string;
  name: string;
  access_key: string;
};

export type FormgongSubmission = {
  id: string;
  created_at: string;
  fields: Record<string, string>;
};
