import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

function encryptionKey(apiKey: string): Buffer {
  return createHash('sha256')
    .update('activepieces-sent-webhook-secret-v1\0')
    .update(apiKey)
    .digest();
}

function encrypt({
  secret,
  apiKey,
  webhookId,
}: {
  secret: string;
  apiKey: string;
  webhookId: string;
}): EncryptedSecret {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(apiKey), iv);
  cipher.setAAD(Buffer.from(webhookId));
  const ciphertext = Buffer.concat([
    cipher.update(secret, 'utf8'),
    cipher.final(),
  ]);
  return {
    iv: iv.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
  };
}

function decrypt({
  encrypted,
  apiKey,
  webhookId,
}: {
  encrypted: EncryptedSecret;
  apiKey: string;
  webhookId: string;
}): string {
  try {
    const decipher = createDecipheriv(
      'aes-256-gcm',
      encryptionKey(apiKey),
      Buffer.from(encrypted.iv, 'base64')
    );
    decipher.setAAD(Buffer.from(webhookId));
    decipher.setAuthTag(Buffer.from(encrypted.tag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(encrypted.ciphertext, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    throw new Error(
      'The Sent webhook signing secret cannot be unlocked. Disable and enable the flow again after changing the connection API key.'
    );
  }
}

function header({
  headers,
  name,
}: {
  headers: Record<string, unknown>;
  name: string;
}): string | undefined {
  const key = Object.keys(headers).find(
    (key) => key.toLowerCase() === name.toLowerCase()
  );
  const value = key ? headers[key] : undefined;
  return typeof value === 'string' ? value : undefined;
}

function scheme({
  version,
  headers,
}: {
  version?: number;
  headers: Record<string, unknown>;
}): WebhookScheme {
  if (version === 1 || version === 2) return version;
  return header({ headers, name: 'webhook-signature' }) ? 2 : 1;
}

function verify({
  secret,
  webhookId,
  version,
  headers,
  rawBody,
  now = Date.now(),
}: VerifyInput): boolean {
  if (typeof rawBody !== 'string' && !Buffer.isBuffer(rawBody)) return false;
  const resolved = scheme({ version, headers });
  const names = HEADER_NAMES[resolved];
  const id = header({ headers, name: names.id });
  const timestamp = header({ headers, name: names.timestamp });
  const signature = header({ headers, name: names.signature });
  if (
    !id ||
    (resolved === 1 && id !== webhookId) ||
    !timestamp ||
    !/^\d+$/.test(timestamp) ||
    !signature
  )
    return false;
  const seconds = Number(timestamp);
  if (
    !Number.isSafeInteger(seconds) ||
    Math.abs(Math.floor(now / 1000) - seconds) > 300
  )
    return false;
  const keyMaterial = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(keyMaterial)) return false;
  const key = Buffer.from(keyMaterial, 'base64');
  if (
    key.length < MIN_SECRET_BYTES ||
    key.length > MAX_SECRET_BYTES ||
    key.toString('base64') !== keyMaterial
  )
    return false;
  const digest = createHmac('sha256', key)
    .update(`${id}.${timestamp}.`, 'utf8')
    .update(rawBody)
    .digest('base64');
  const expected = Buffer.from(`v1,${digest}`);
  return signature.split(' ').some((part) => {
    const candidate = Buffer.from(part.trim());
    return (
      candidate.length === expected.length &&
      timingSafeEqual(candidate, expected)
    );
  });
}

const MIN_SECRET_BYTES = 24;
const MAX_SECRET_BYTES = 64;

const HEADER_NAMES: Record<
  WebhookScheme,
  { id: string; timestamp: string; signature: string }
> = {
  1: {
    id: 'X-Webhook-ID',
    timestamp: 'X-Webhook-Timestamp',
    signature: 'X-Webhook-Signature',
  },
  2: {
    id: 'webhook-id',
    timestamp: 'webhook-timestamp',
    signature: 'webhook-signature',
  },
};

export const sentSecurity = { encrypt, decrypt, header, scheme, verify };
export type WebhookScheme = 1 | 2;
export type EncryptedSecret = { iv: string; ciphertext: string; tag: string };
export type VerifyInput = {
  secret: string;
  webhookId: string;
  version?: number;
  headers: Record<string, unknown>;
  rawBody: unknown;
  now?: number;
};
