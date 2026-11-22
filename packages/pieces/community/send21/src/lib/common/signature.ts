import { createHmac, timingSafeEqual } from 'crypto';

export const TOLERANCE_SECONDS = 5 * 60;

const hmacHex = (secret: string, data: Buffer) =>
  createHmac('sha256', secret).update(data).digest('hex');

function safeEqualHex(a: string, b: string): boolean {
  try {
    const x = Buffer.from(a, 'hex');
    const y = Buffer.from(b, 'hex');
    return x.length === y.length && x.length > 0 && timingSafeEqual(x, y);
  } catch {
    return false;
  }
}

export function signV2(
  rawBody: Buffer | string,
  deliveryId: string,
  timestamp: number | string,
  secret: string
): string {
  const signed = Buffer.concat([
    Buffer.from(`${timestamp}.${deliveryId}.`),
    Buffer.from(rawBody),
  ]);
  return `t=${timestamp},v1=${hmacHex(secret, signed)}`;
}

/**
 * Check X-Send21-Signature-V2: t=<unix seconds>,v1=<hex HMAC-SHA256 of "<t>.<delivery id>.<raw body>">.
 * Refuse deliveries older than 5 minutes. A missing or malformed header returns false.
 */
export function verifySignatureV2(
  rawBody: Buffer | string,
  header: string | undefined,
  deliveryId: string | undefined,
  secret: string,
  { now = Date.now() / 1000, toleranceSeconds = TOLERANCE_SECONDS }: { now?: number; toleranceSeconds?: number } = {}
): boolean {
  if (!secret || typeof header !== 'string' || !deliveryId) return false;
  const parts: Record<string, string> = {};
  for (const part of header.split(',')) {
    const i = part.indexOf('=');
    if (i > 0) parts[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  if (!/^\d+$/.test(parts.t ?? '') || !parts.v1) return false;
  if (Math.abs(now - Number(parts.t)) > toleranceSeconds) return false;
  const expected = signV2(rawBody, deliveryId, parts.t, secret).split(',v1=')[1];
  return safeEqualHex(parts.v1, expected ?? '');
}

export function headerValue(headers: Record<string, unknown> | undefined, name: string): string | undefined {
  if (!headers) return undefined;
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lower) {
      if (typeof value === 'string') return value;
      if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    }
  }
  return undefined;
}
