import { createHmac, timingSafeEqual } from 'node:crypto';

function verifySignature({
  secret,
  headers,
  rawBody,
  nowSeconds,
}: {
  secret: string;
  headers: Record<string, string | string[] | undefined>;
  rawBody: unknown;
  nowSeconds: number;
}): { valid: true; webhookId: string } | { valid: false; reason: string } {
  const lower = lowerCaseHeaders({ headers });
  const webhookId = lower['webhook-id'];
  const timestamp = lower['webhook-timestamp'];
  const signatures = lower['webhook-signature'];
  if (webhookId === undefined || timestamp === undefined || signatures === undefined) {
    return { valid: false, reason: 'missing signature headers' };
  }
  if (!/^\d{1,12}$/.test(timestamp)) {
    return { valid: false, reason: 'bad timestamp' };
  }
  if (Math.abs(nowSeconds - Number(timestamp)) > TOLERANCE_SECONDS) {
    return { valid: false, reason: 'timestamp outside the tolerance window' };
  }
  const body = typeof rawBody === 'string' ? rawBody : Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : undefined;
  if (body === undefined) {
    return { valid: false, reason: 'raw body unavailable' };
  }
  const key = secretKey({ secret });
  if (key.length === 0) {
    return { valid: false, reason: 'empty secret' };
  }
  const expected = createHmac('sha256', key).update(`${webhookId}.${timestamp}.${body}`).digest();
  const matches = signatures
    .split(' ')
    .filter((entry) => entry.startsWith('v1,'))
    .some((entry) => {
      const given = Buffer.from(entry.slice(3), 'base64');
      return given.length === expected.length && timingSafeEqual(given, expected);
    });
  return matches ? { valid: true, webhookId } : { valid: false, reason: 'signature mismatch' };
}

function secretKey({ secret }: { secret: string }): Buffer {
  const trimmed = secret.trim();
  const encoded = trimmed.startsWith('whsec_') ? trimmed.slice('whsec_'.length) : trimmed;
  return Buffer.from(encoded, 'base64');
}

function lowerCaseHeaders({ headers }: { headers: Record<string, string | string[] | undefined> }): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [name.toLowerCase(), Array.isArray(value) ? value.join(' ') : value])
  );
}

function rememberDelivery({ seen, webhookId }: { seen: string[]; webhookId: string }): { duplicate: boolean; seen: string[] } {
  if (seen.includes(webhookId)) {
    return { duplicate: true, seen };
  }
  return { duplicate: false, seen: [...seen, webhookId].slice(-MAX_SEEN_IDS) };
}

function sign({ secret, webhookId, timestamp, body }: { secret: string; webhookId: string; timestamp: number; body: string }): string {
  return `v1,${createHmac('sha256', secretKey({ secret })).update(`${webhookId}.${timestamp}.${body}`).digest('base64')}`;
}

const TOLERANCE_SECONDS = 900;
const MAX_SEEN_IDS = 100;

export const fathomWebhook = {
  verifySignature,
  rememberDelivery,
  sign,
  TOLERANCE_SECONDS,
  MAX_SEEN_IDS,
};
