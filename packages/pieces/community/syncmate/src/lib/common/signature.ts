import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Assistro signs every event delivery (App\Support\Events\EventSigner):
 *   X-Assistro-Timestamp: <unix seconds>
 *   X-Assistro-Signature: sha256=<hex HMAC-SHA256(secret, "<timestamp>.<raw body>")>
 */
export function signEvent(secret: string, rawBody: string, timestamp: number): string {
  return `sha256=${createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')}`;
}

export function verifyEvent(input: {
  secret: string;
  rawBody: string;
  timestamp: unknown;
  signature: unknown;
  nowSeconds?: number;
  toleranceSeconds?: number;
}): boolean {
  const timestamp = Number(input.timestamp);
  const signature = typeof input.signature === 'string' ? input.signature : '';
  if (!Number.isInteger(timestamp) || signature === '' || input.secret === '') return false;

  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > (input.toleranceSeconds ?? 300)) return false;

  const expected = Buffer.from(signEvent(input.secret, input.rawBody, timestamp));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** A header value from Activepieces' lower- or mixed-case header map. */
export function header(headers: Record<string, unknown> | undefined, name: string): string | undefined {
  if (!headers) return undefined;
  const wanted = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === wanted) {
      return Array.isArray(value) ? String(value[0]) : String(value);
    }
  }
  return undefined;
}
