import { HttpMethod, httpClient } from '@activepieces/pieces-common';

async function callTool({
  apiKey,
  tool,
  body = {},
}: {
  apiKey: string;
  tool: string;
  body?: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  try {
    const response = await httpClient.sendRequest<unknown>({
      method: HttpMethod.POST,
      url: `${FIRSTTOUCH_BASE_URL}/${tool}`,
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body,
    });
    return isRecord(response.body) ? response.body : {};
  } catch (error: unknown) {
    throw toFirstTouchError({ error, tool });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readFailure(error: unknown): { status: number | undefined; body: unknown } {
  if (!isRecord(error) && !(error instanceof Error)) {
    return { status: undefined, body: undefined };
  }
  const response: unknown = Reflect.get(error, 'response');
  if (!isRecord(response)) {
    return { status: undefined, body: undefined };
  }
  const status = response['status'];
  return {
    status: typeof status === 'number' ? status : undefined,
    body: response['body'],
  };
}

function vendorMessage(body: unknown): string | undefined {
  if (typeof body === 'string' && body.trim() !== '') {
    return body.slice(0, 400);
  }
  if (!isRecord(body)) {
    return undefined;
  }
  const trace = typeof body['traceId'] === 'string' ? ` [trace ${body['traceId']}]` : '';
  for (const key of ['message', 'error', 'detail', 'title']) {
    const value = body[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return `${value.slice(0, 400)}${trace}`;
    }
  }
  return undefined;
}

function toFirstTouchError({ error, tool }: { error: unknown; tool: string }): FirstTouchApiError {
  const { status, body } = readFailure(error);
  const detail = vendorMessage(body);
  let message: string;
  if (status === 401) {
    message = 'FirstTouch rejected the API key. Check the connection.';
  } else if (status === 403) {
    message = 'This FirstTouch API key is not allowed to do that. Use a key created by a team admin.';
  } else if (status === 429) {
    message = 'FirstTouch rate limit reached. Try again shortly.';
  } else if (status === undefined) {
    message = `Could not reach FirstTouch (${tool}).`;
  } else {
    message = `FirstTouch request failed with status ${status} (${tool}).`;
  }
  return new FirstTouchApiError({
    message: detail ? `${message} ${detail}` : message,
    statusCode: status,
  });
}

class FirstTouchApiError extends Error {
  readonly statusCode: number | undefined;
  constructor({ message, statusCode }: { message: string; statusCode: number | undefined }) {
    super(message);
    this.name = 'FirstTouchApiError';
    this.statusCode = statusCode;
  }
}

const FIRSTTOUCH_BASE_URL = 'https://gateway.firsttouch.ai/api/public/tools';

export const firstTouchClient = { callTool, isRecord };
export { FIRSTTOUCH_BASE_URL, FirstTouchApiError };
