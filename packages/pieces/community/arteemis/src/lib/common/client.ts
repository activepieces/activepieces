import { AuthenticationType, HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';

export const ARTEEMIS_API_URL = 'https://api.arteemis.xyz/api/v1';

/** What every Arteemis tool answers: `{summary, data, next_cursor?, job_id?}`. */
export type ArteemisEnvelope<T> = {
  summary: string;
  data: T;
  next_cursor?: string | null;
  job_id?: string;
};

export class ArteemisApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor({ message, status, code }: { message: string; status: number; code: string }) {
    super(message);
    this.name = 'ArteemisApiError';
    this.status = status;
    this.code = code;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Turns the API's error envelope `{error: {code, message}}` into a message a salesperson can act on. */
function toArteemisError(error: unknown): unknown {
  if (!(error instanceof HttpError)) {
    return error;
  }
  const { status, body } = error.response;
  const detail = isRecord(body) && isRecord(body['error']) ? body['error'] : {};
  const code = typeof detail['code'] === 'string' ? detail['code'] : `HTTP_${status}`;
  if (status === 401) {
    return new ArteemisApiError({
      message: 'Arteemis refused the API key. Create a workspace key in Settings > MCP & API and reconnect.',
      status,
      code,
    });
  }
  const message = typeof detail['message'] === 'string' ? detail['message'] : `Arteemis answered ${status}.`;
  return new ArteemisApiError({ message, status, code });
}

/**
 * Calls one Arteemis tool: a POST to /tools/{tool} with its arguments as the JSON body. The same tools as the
 * Arteemis MCP server, listed at https://api.arteemis.xyz/api/v1.
 */
async function call<T>({
  apiKey,
  tool,
  body = {},
}: {
  apiKey: string;
  tool: string;
  body?: Record<string, unknown>;
}): Promise<ArteemisEnvelope<T>> {
  try {
    const response = await httpClient.sendRequest<ArteemisEnvelope<T>>({
      method: HttpMethod.POST,
      url: `${ARTEEMIS_API_URL}/tools/${tool}`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: apiKey },
      body,
    });
    return response.body;
  } catch (error) {
    throw toArteemisError(error);
  }
}

/** Keeps the filled values only, strings trimmed. */
function filled(values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    const clean = typeof value === 'string' ? value.trim() : value;
    if (clean !== undefined && clean !== null && clean !== '') {
      out[key] = clean;
    }
  }
  return out;
}

export const arteemisApi = { call, filled };
