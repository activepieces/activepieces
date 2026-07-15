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

// Reddit canonicalizes email before hashing for all domains (not Gmail-specific): lowercase,
// strip the "+alias", then remove every non-alphanumeric character from the local part.
// https://business.reddithelp.com/s/article/advanced-matching-for-developers
const canonicalizeEmail = (value: string): string => {
  const [localPart, domain] = value.trim().toLowerCase().split('@');
  if (!domain) {
    return value.trim().toLowerCase();
  }
  const cleanedLocalPart = localPart.split('+')[0].replace(/[^a-z0-9]/g, '');
  return `${cleanedLocalPart}@${domain}`;
};

const toE164 = (value: string): string => {
  const withoutExtension = value.replace(
    /\s*(?:ext(?:ension)?\.?|x)\s*:?\s*\d+\s*$/i,
    ''
  );
  const digitsOnly = withoutExtension.replace(/\D/g, '');
  return `+${digitsOnly}`;
};

const lowerTrim = (value: string): string => value.toLowerCase().trim();
const upperTrim = (value: string): string => value.toUpperCase().trim();
const trim = (value: string): string => value.trim();

export const identityHashing = {
  email: hashWith(canonicalizeEmail),
  phone: hashWith(toE164),
  externalId: hashWith(trim),
  idfa: hashWith(upperTrim),
  aaid: hashWith(lowerTrim),
};
