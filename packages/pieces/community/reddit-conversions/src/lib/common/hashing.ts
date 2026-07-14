import { createHash } from 'crypto';

const SHA256_HEX = /^[a-f0-9]{64}$/i;

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function hashWith(normalize: (raw: string) => string) {
  return (raw: string | undefined | null): string | undefined => {
    if (raw === undefined || raw === null) {
      return undefined;
    }
    const trimmed = String(raw).trim();
    if (trimmed.length === 0) {
      return undefined;
    }
    // Treat an input that already looks like a SHA-256 digest as pre-hashed and pass it
    // through, so callers who hash upstream aren't double-hashed. Tradeoff: a raw value that
    // happens to be exactly 64 hex chars is sent unhashed.
    if (SHA256_HEX.test(trimmed)) {
      return trimmed.toLowerCase();
    }
    return sha256(normalize(trimmed));
  };
}

const canonicalizeEmail = (value: string): string => {
  const [localPart, domain] = value.trim().split('@');
  if (!domain) {
    return value.trim().toLowerCase();
  }
  const cleanedLocalPart = localPart.replace(/\./g, '').split('+')[0];
  return `${cleanedLocalPart.toLowerCase()}@${domain.toLowerCase()}`;
};

const toE164 = (value: string): string => {
  const digitsOnly = value.replace(/\D/g, '');
  return `+${digitsOnly}`;
};

const lowerTrim = (value: string): string => value.toLowerCase().trim();
const trim = (value: string): string => value.trim();

export const identityHashing = {
  email: hashWith(canonicalizeEmail),
  phone: hashWith(toE164),
  externalId: hashWith(trim),
  ipAddress: hashWith(trim),
  mobileId: hashWith(lowerTrim),
};
