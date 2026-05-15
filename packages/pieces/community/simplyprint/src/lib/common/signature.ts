import { randomBytes, timingSafeEqual } from 'crypto';

function generateWebhookSecret(): string {
  return randomBytes(32).toString('hex');
}

function verifySimplyprintSignature(
  header: string | undefined,
  secret: string | undefined,
): boolean {
  if (!secret || !header) return false;
  if (header.length !== secret.length) return false;

  try {
    return timingSafeEqual(Buffer.from(secret, 'utf8'), Buffer.from(header, 'utf8'));
  } catch {
    return false;
  }
}

// Some proxies forward the case-original header; AP normalises to lowercase.
function extractSecretHeader(headers: Record<string, string | undefined>): string | undefined {
  return headers['x-sp-secret'] ?? headers['X-SP-Secret'] ?? headers['X-Sp-Secret'];
}

export const simplyprintSignature = {
  generateWebhookSecret,
  verifySimplyprintSignature,
  extractSecretHeader,
};
