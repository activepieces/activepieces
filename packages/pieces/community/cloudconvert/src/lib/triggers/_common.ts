import { createHmac } from 'node:crypto';

export function verifyCloudConvertSignature(params: {
  rawBody: string;
  signatureHeader?: string;
  signingSecret?: string;
}): boolean {
  const { rawBody, signatureHeader, signingSecret } = params;
  if (!signatureHeader || !signingSecret) return false;
  try {
    const h = createHmac('sha256', signingSecret);
    h.update(rawBody, 'utf8');
    const digest = `sha256=${h.digest('hex')}`;
    return timingSafeEqual(digest, signatureHeader);
  } catch {
    return false;
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    // eslint-disable-next-line no-bitwise
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function getRawBodyFallback(body: unknown): string {
  try {
    return typeof body === 'string' ? body : JSON.stringify(body ?? {});
  } catch {
    return '';
  }
}