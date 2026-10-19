import crypto from 'crypto';

export const exaWebhookSignature = { HEADER: 'exa-signature', verify, problemOf, headerOf };

function verify(params: SignatureCheck): boolean {
  return problemOf(params) === undefined;
}

function problemOf({ secret, signatureHeader, rawBody, nowMs = Date.now() }: SignatureCheck): string | undefined {
  if (!secret) {
    return 'no webhook secret is stored for this flow';
  }
  if (!signatureHeader) {
    return 'the Exa-Signature header is missing';
  }
  const payload = bytesOf(rawBody);
  if (payload === undefined) {
    return 'the raw request body is not available';
  }
  const parts = partsOf(signatureHeader);
  const timestamp = parts.get('t');
  const signatures = parts.getAll('v1');
  if (!timestamp || signatures.length === 0) {
    return 'the Exa-Signature header is malformed';
  }
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.`)
    .update(payload)
    .digest();
  if (!signatures.some((signature) => matches({ expected, signature }))) {
    return 'the signature does not match';
  }
  if (!isRecent({ timestamp, nowMs })) {
    return `it was signed more than 15 minutes ago (t=${timestamp})`;
  }
  return undefined;
}

function isRecent({ timestamp, nowMs }: { timestamp: string; nowMs: number }): boolean {
  if (!/^\d+$/.test(timestamp)) {
    return false;
  }
  const value = Number(timestamp);
  const sentSeconds = value > MILLISECOND_TIMESTAMP_FLOOR ? value / 1000 : value;
  return Math.abs(nowMs / 1000 - sentSeconds) <= TIMESTAMP_TOLERANCE_SECONDS;
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

function bytesOf(rawBody: unknown): Buffer | undefined {
  if (Buffer.isBuffer(rawBody)) {
    return rawBody;
  }
  if (typeof rawBody === 'string') {
    return Buffer.from(rawBody, 'utf8');
  }
  return undefined;
}

function partsOf(header: string): { get: (key: string) => string | undefined; getAll: (key: string) => string[] } {
  const pairs = header
    .split(',')
    .map((part) => part.trim())
    .map((part) => {
      const index = part.indexOf('=');
      return index === -1 ? ['', ''] : [part.slice(0, index), part.slice(index + 1)];
    });
  return {
    get: (key) => pairs.find(([k]) => k === key)?.[1],
    getAll: (key) => pairs.filter(([k]) => k === key).map(([, v]) => v),
  };
}

function matches({ expected, signature }: { expected: Buffer; signature: string }): boolean {
  if (!/^[0-9a-fA-F]+$/.test(signature)) {
    return false;
  }
  const provided = Buffer.from(signature, 'hex');
  return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
}

const TIMESTAMP_TOLERANCE_SECONDS = 900;
const MILLISECOND_TIMESTAMP_FLOOR = 1e12;

type SignatureCheck = {
  secret: string | undefined;
  signatureHeader: string | undefined;
  rawBody: unknown;
  nowMs?: number;
};
