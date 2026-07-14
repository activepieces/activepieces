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

const lower = (value: string): string => value.toLowerCase().trim();
const digitsOnly = (value: string): string => value.replace(/\D/g, '');
const phone = (value: string): string => digitsOnly(value).replace(/^0+/, '');
const stripSpacesAndPunctuation = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '');

export const identityHashing = {
  email: hashWith(lower),
  phone: hashWith(phone),
  firstName: hashWith(lower),
  lastName: hashWith(lower),
  city: hashWith(stripSpacesAndPunctuation),
  state: hashWith(lower),
  zip: hashWith(digitsOnly),
  country: hashWith(lower),
  gender: hashWith(lower),
  dateOfBirth: hashWith(digitsOnly),
  externalId: hashWith((value) => value.trim()),
  maid: hashWith(lower),
};
