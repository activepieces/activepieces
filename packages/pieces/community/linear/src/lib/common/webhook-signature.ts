import crypto from 'crypto';

function verify({
  secret,
  signatureHeader,
  rawBody,
}: {
  secret: string | undefined;
  signatureHeader: string | undefined;
  rawBody: unknown;
}): boolean {
  if (!secret || !signatureHeader || !HEX.test(signatureHeader)) {
    return false;
  }
  const payload = bytesOf(rawBody);
  if (payload === undefined) {
    return false;
  }
  const expected = crypto.createHmac('sha256', secret).update(payload).digest();
  const provided = Buffer.from(signatureHeader, 'hex');
  return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
}

function headerOf({
  headers,
  name,
}: {
  headers: Record<string, string> | undefined;
  name: string;
}): string | undefined {
  if (!headers) {
    return undefined;
  }
  const key = Object.keys(headers).find((header) => header.toLowerCase() === name);
  return key === undefined ? undefined : headers[key];
}

function newSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

function bytesOf(rawBody: unknown): Buffer | undefined {
  if (Buffer.isBuffer(rawBody)) {
    return rawBody;
  }
  if (typeof rawBody === 'string') {
    return Buffer.from(rawBody, 'utf8');
  }
  return undefined;
}

const HEX = /^[0-9a-fA-F]+$/;

export const LINEAR_SIGNATURE_HEADER = 'linear-signature';

export const linearWebhookSignature = { verify, headerOf, newSecret };
