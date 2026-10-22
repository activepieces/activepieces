import { AuthenticationType, HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';

async function request<T>({
  apiKey,
  method,
  path,
  body,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
}): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}${path}`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: apiKey },
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    return response.body;
  } catch (e) {
    if (e instanceof HttpError) {
      throw new Error(errorMessage(e.response.status, e.response.body));
    }
    throw e;
  }
}

function errorMessage(status: number, body: unknown): string {
  const field = (key: string): unknown =>
    typeof body === 'object' && body !== null ? Reflect.get(body, key) : undefined;
  const text = (key: string): string | undefined => {
    const value = field(key);
    return typeof value === 'string' ? value : undefined;
  };
  const apiMessage = text('message') ?? text('error') ?? (typeof body === 'string' ? body.slice(0, 300) : undefined);

  if (status === 401) {
    return `ContextFetch did not accept the API key. Check the key in the connection, or get a free key with 2,500 credits: POST ${BASE_URL}/v1/keys/free`;
  }
  if (status === 402) {
    return `${apiMessage ?? 'ContextFetch credits ran out.'} Buy credits: ${BUY_URL}`;
  }
  if (status === 400 && text('error') === 'url_not_allowed') {
    return 'This URL cannot be fetched. Only public http(s) URLs are allowed.';
  }
  if (status === 422) {
    return `ContextFetch rejected the parameters: ${validationText(field('detail')) || 'invalid request'}`;
  }
  if (status === 429) {
    return 'ContextFetch is rate limiting requests. Wait a few seconds and try again.';
  }
  if (status >= 500) {
    return `${apiMessage ?? `ContextFetch answered HTTP ${status}`}. Try again shortly; paid requests that fail are refunded.`;
  }
  return `ContextFetch API error (${status}): ${apiMessage ?? JSON.stringify(body)}`;
}

// FastAPI 422 detail: [{ loc: ['body', 'query'], msg: '...' }] -> "query: ..."
function validationText(detail: unknown): string {
  if (typeof detail === 'string') return detail;
  if (!Array.isArray(detail)) return '';
  return detail
    .map((item: unknown) => {
      if (typeof item !== 'object' || item === null) return '';
      const loc: unknown = Reflect.get(item, 'loc');
      const msg: unknown = Reflect.get(item, 'msg');
      const where = Array.isArray(loc) ? loc.slice(1).join('.') : '';
      return `${where}: ${typeof msg === 'string' ? msg : ''}`;
    })
    .join('; ');
}

export const BASE_URL = 'https://api.contextfetch.dev';
const BUY_URL = `${BASE_URL}/buy/instant`;

export const contextfetchApi = { request };
