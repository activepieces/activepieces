import { createHash, createHmac } from 'node:crypto';

export type QueryValue =
  | string
  | number
  | ReadonlyArray<string | number>
  | null
  | undefined;
export type QueryParams = Record<string, QueryValue>;

export interface SignRequestInput {
  method: string;
  path: string;
  query?: string | QueryParams;
  body?: string | Buffer;
  publicKey: string;
  secretKey: string;
  timestamp?: string | number;
}

export interface SignedHeaders {
  Authorization: string;
  'X-Request-Timestamp': string;
}

function rfc3986(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export function encodePathSegment(value: string): string {
  return rfc3986(value);
}

export function canonicalizeQuery(filters?: QueryParams): string {
  if (!filters) {
    return '';
  }
  const parts: string[] = [];
  for (const key of Object.keys(filters).sort()) {
    const raw = filters[key];
    if (raw === undefined || raw === null) {
      continue;
    }
    const values = Array.isArray(raw) ? [...raw].sort() : [raw];
    if (values.length === 0) {
      throw new TypeError(`Paymos query filter cannot be empty: ${key}`);
    }
    for (const value of values) {
      if (
        (typeof value !== 'string' && typeof value !== 'number') ||
        String(value) === ''
      ) {
        throw new TypeError(`Invalid Paymos query filter: ${key}`);
      }
      parts.push(`${rfc3986(key)}=${rfc3986(String(value))}`);
    }
  }
  return parts.length === 0 ? '' : `?${parts.join('&')}`;
}

export function sha256Hex(body: string | Buffer): string {
  if (typeof body === 'string') {
    if (body === '') {
      return '';
    }
    return createHash('sha256').update(body, 'utf8').digest('hex');
  }
  if (body.length === 0) {
    return '';
  }
  return createHash('sha256').update(body).digest('hex');
}

export function stringToSign(
  timestamp: string | number,
  method: string,
  path: string,
  query = '',
  body: string | Buffer = '',
): string {
  const bodyHash = sha256Hex(body);
  return `${timestamp}\n${method.toUpperCase()}\n${path}\n${query}\n${bodyHash}`;
}

export function sign(secret: string, value: string): string {
  return createHmac('sha256', secret).update(value, 'utf8').digest('base64');
}

export function authorizationHeader(
  apiKey: string,
  apiSecret: string,
  timestamp: string | number,
  method: string,
  path: string,
  query = '',
  body: string | Buffer = '',
): string {
  const signature = sign(
    apiSecret,
    stringToSign(timestamp, method, path, query, body),
  );
  return `HMAC-SHA256 ${apiKey}:${signature}`;
}

export function signRequest(input: SignRequestInput): SignedHeaders {
  const timestamp =
    input.timestamp !== undefined
      ? String(input.timestamp)
      : String(Math.floor(Date.now() / 1000));
  const queryString =
    typeof input.query === 'string'
      ? input.query
      : input.query !== undefined
        ? canonicalizeQuery(input.query)
        : '';
  const body = input.body ?? '';
  return {
    Authorization: authorizationHeader(
      input.publicKey,
      input.secretKey,
      timestamp,
      input.method,
      input.path,
      queryString,
      body,
    ),
    'X-Request-Timestamp': timestamp,
  };
}
