import { FilesService } from '@activepieces/pieces-framework';
import { fromBuffer } from 'file-type';
import mime from 'mime-types';

export async function convertBase64FieldsToUrls(
  value: unknown,
  files: FilesService
): Promise<unknown> {
  if (typeof value === 'string' && isBase64(value)) {
    const { data, mimeType } = await decodeBase64String(value);
    const extension = mime.extension(mimeType) || 'bin';
    return files.write({ fileName: `file.${extension}`, data });
  }
  if (Array.isArray(value)) {
    return Promise.all(value.map((item) => convertBase64FieldsToUrls(item, files)));
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = await convertBase64FieldsToUrls(val, files);
    }
    return result;
  }
  return value;
}

// Safely above the largest common hash/fingerprint (SHA-512 base64 = 88 chars)
const RAW_BASE64_MIN_CHARS = 200;

// Above this length, sample instead of scanning the full string — O(1) for large payloads
const BASE64_FULL_SCAN_THRESHOLD = 1_000;
const BASE64_SAMPLE_COUNT = 200;

const DATA_URI_BASE64_REGEX =
  /^data:([a-zA-Z0-9][a-zA-Z0-9!#$&\-^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_]*);base64,([A-Za-z0-9+/\-_]+=*)$/;

const BASE64_CHARS = new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=_-');

// Hex chars are a subset of base64 chars — pure-hex strings are hashes, not binary files
const HEX_CHARS = new Set('0123456789abcdefABCDEF');

function isBase64(value: string): boolean {
  if (DATA_URI_BASE64_REGEX.test(value)) return true;
  return isRawBase64(value);
}

function isRawBase64(value: string): boolean {
  if (value.length < RAW_BASE64_MIN_CHARS) return false;

  // Valid base64 length % 4 is never 1 (would require a half-byte with no valid padding)
  const unpadded = value.replace(/=+$/, '');
  if (unpadded.length % 4 === 1) return false;

  // Scan/sample: validate charset and require at least one non-hex character.
  // A string composed entirely of [0-9a-fA-F] is a hex-encoded hash or fingerprint.
  let hasNonHexChar = false;
  if (value.length <= BASE64_FULL_SCAN_THRESHOLD) {
    for (const ch of value) {
      if (!BASE64_CHARS.has(ch)) return false;
      if (!HEX_CHARS.has(ch)) hasNonHexChar = true;
    }
  } else {
    for (let i = 0; i < BASE64_SAMPLE_COUNT; i++) {
      const pos = Math.floor(Math.random() * value.length);
      const ch = value[pos];
      if (!BASE64_CHARS.has(ch)) return false;
      if (!HEX_CHARS.has(ch)) hasNonHexChar = true;
    }
  }
  return hasNonHexChar;
}

async function decodeBase64String(value: string): Promise<{ data: Buffer; mimeType: string }> {
  const dataUriMatch = value.match(DATA_URI_BASE64_REGEX);
  if (dataUriMatch) {
    return { data: Buffer.from(dataUriMatch[2], 'base64'), mimeType: dataUriMatch[1] };
  }
  const data = Buffer.from(value, 'base64');
  const detected = await fromBuffer(data);
  return { data, mimeType: detected?.mime ?? 'application/octet-stream' };
}
