import { createHmac, timingSafeEqual } from 'node:crypto';

export const REPLAY_TOLERANCE_SECONDS = 300;

export type VerifyResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'missing_header' | 'malformed_header' | 'bad_signature' | 'stale_timestamp' | 'unusable_raw_body';
    };

export function verifyWebhookSignature(
  header: string | undefined,
  rawBody: unknown,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): VerifyResult {
  if (!header) return { ok: false, reason: 'missing_header' };
  if (!Buffer.isBuffer(rawBody) && typeof rawBody !== 'string') {
    return { ok: false, reason: 'unusable_raw_body' };
  }

  const parts = new Map<string, string>();
  for (const kv of header.split(',')) {
    const idx = kv.indexOf('=');
    if (idx > 0) parts.set(kv.slice(0, idx).trim(), kv.slice(idx + 1).trim());
  }

  const t = parts.get('t');
  const v1 = parts.get('v1');
  if (!t || !v1) return { ok: false, reason: 'malformed_header' };

  const ts = Number(t);
  if (!Number.isFinite(ts)) return { ok: false, reason: 'malformed_header' };
  if (Math.abs(nowSeconds - ts) > REPLAY_TOLERANCE_SECONDS) {
    return { ok: false, reason: 'stale_timestamp' };
  }

  const body = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
  const expected = createHmac('sha256', secret).update(`${t}.${body}`).digest('hex');

  const a = Buffer.from(v1, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length === 0 || a.length !== b.length) return { ok: false, reason: 'bad_signature' };
  if (!timingSafeEqual(a, b)) return { ok: false, reason: 'bad_signature' };

  return { ok: true };
}

export function findHeader(headers: Record<string, string>, name: string): string | undefined {
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === target) return value;
  }
  return undefined;
}
