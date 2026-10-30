import { createHash, createHmac, timingSafeEqual } from 'crypto';

export function hmacHex(secret: string, data: string | Buffer): string {
  return createHmac('sha256', secret).update(data).digest('hex');
}

export function md5Hex(data: string): string {
  return createHash('md5').update(data).digest('hex');
}

/** Constant-time comparison of a hex signature with a header value. */
export function signatureMatches(expected: string, given: string | undefined): boolean {
  if (!given || given.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(expected), Buffer.from(given.toLowerCase()));
}

/**
 * The auth_* query parameters of a Pusher-compatible HTTP API request: an
 * HMAC-SHA256 of "METHOD\nPATH\nsorted query" with the app secret. A body is
 * covered by body_md5, so it must be sent exactly as passed here.
 */
export function signQuery({
  key,
  secret,
  method,
  path,
  query,
  body,
  now = Date.now(),
}: {
  key: string;
  secret: string;
  method: string;
  path: string;
  query: Record<string, string>;
  body?: string;
  now?: number;
}): Record<string, string> {
  const qs: Record<string, string> = {
    ...query,
    auth_key: key,
    auth_timestamp: Math.floor(now / 1000).toString(),
    auth_version: '1.0',
  };
  if (body !== undefined) {
    qs['body_md5'] = md5Hex(body);
  }
  const canonical = Object.keys(qs)
    .map((k) => [k.toLowerCase(), qs[k]] as const)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  qs['auth_signature'] = hmacHex(secret, `${method.toUpperCase()}\n${path}\n${canonical}`);
  return qs;
}
