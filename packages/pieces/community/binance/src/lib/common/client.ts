import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';

class BinanceApiError extends Error {
  readonly status: number | undefined;
  readonly code: number | undefined;
  readonly responseBody: unknown;

  constructor({ message, status, code, responseBody }: BinanceApiErrorParams) {
    super(message);
    this.name = 'BinanceApiError';
    this.status = status;
    this.code = code;
    this.responseBody = responseBody;
  }
}

async function get<T>({ path, queryParams, subject, timeoutMs = DEFAULT_TIMEOUT_MS }: GetParams): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method: HttpMethod.GET,
      url: `${MARKET_DATA_URL}${path}`,
      queryParams,
      timeout: timeoutMs,
    });
    return response.body;
  } catch (error) {
    throw toError({ error, subject, timeoutMs });
  }
}

function toError({ error, subject, timeoutMs }: { error: unknown; subject?: string; timeoutMs: number }): unknown {
  if (error instanceof HttpError) {
    const { status, body } = error.response;
    const { code, msg } = parseBinanceBody(body);
    return new BinanceApiError({
      message: describeFailure({ status, code, msg, subject }),
      status,
      code,
      responseBody: body,
    });
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return new BinanceApiError({
      message: `Binance did not answer within ${timeoutMs / 1000} seconds. This is a read-only request, so it is safe to retry.`,
    });
  }
  return error;
}

function describeFailure({
  status,
  code,
  msg,
  subject,
}: {
  status: number;
  code: number | undefined;
  msg: string | undefined;
  subject: string | undefined;
}): string {
  const target = subject ?? 'the symbol';
  if (status === 451) {
    return 'Binance blocks requests from the region this server runs in (HTTP 451). Binance does not serve this region.';
  }
  if (status === 418) {
    return "Binance has temporarily banned this server's IP address (HTTP 418) after repeated rate-limit errors. Bans last from 2 minutes up to 3 days; wait before running this step again.";
  }
  if (status === 429) {
    return "Binance rate limit reached (HTTP 429): this server's IP address used too much request weight in the last minute. Wait about a minute before retrying; retrying straight away can get the IP banned.";
  }
  if (status === 403) {
    return "Binance's firewall rejected the request (HTTP 403). This usually means this server's IP address is rate limited or blocked; wait a few minutes before retrying.";
  }
  if (code === -1121) {
    return `Binance does not list ${target}. Use the base asset followed by the quote asset with nothing between them (for example BTCUSDT), and check the pair with List Trading Pairs.`;
  }
  if (code === -1220) {
    return `${capitalize(target)} is listed on Binance but is not trading right now (halted or delisted), so it has no live price.`;
  }
  if (status >= 500) {
    return `Binance had a server error (HTTP ${status}). This is a read-only request, so it is safe to retry.`;
  }
  const detail = msg ?? 'no error message';
  return code === undefined
    ? `Binance request failed (HTTP ${status}): ${detail}`
    : `Binance rejected the request (HTTP ${status}, code ${code}): ${detail}`;
}

function parseBinanceBody(body: unknown): { code: number | undefined; msg: string | undefined } {
  const parsed = typeof body === 'string' ? parseJson(body) : body;
  if (typeof parsed === 'string') {
    return { code: undefined, msg: parsed.trim() === '' ? undefined : parsed.slice(0, 300) };
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { code: undefined, msg: undefined };
  }
  const code: unknown = Reflect.get(parsed, 'code');
  const msg: unknown = Reflect.get(parsed, 'msg');
  return {
    code: typeof code === 'number' ? code : undefined,
    msg: typeof msg === 'string' ? msg : undefined,
  };
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const MARKET_DATA_URL = 'https://data-api.binance.vision/api/v3';
const DEFAULT_TIMEOUT_MS = 30_000;
const SLOW_TIMEOUT_MS = 60_000;

export const binanceClient = {
  get,
  MARKET_DATA_URL,
  DEFAULT_TIMEOUT_MS,
  SLOW_TIMEOUT_MS,
};

type GetParams = {
  path: string;
  queryParams?: Record<string, string>;
  subject?: string;
  timeoutMs?: number;
};

type BinanceApiErrorParams = {
  message: string;
  status?: number;
  code?: number;
  responseBody?: unknown;
};
