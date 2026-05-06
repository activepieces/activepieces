import { FilesService } from '@activepieces/pieces-framework';
import { fromBuffer } from 'file-type';
import mime from 'mime-types';

export async function convertBase64FieldsToUrls(
  value: unknown,
  files: FilesService
): Promise<unknown> {
  if (typeof value === 'string' && isLargeBase64(value)) {
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

// Strings shorter than this are treated as tokens/hashes, not binary data
const BASE64_CONVERT_MIN_CHARS = 10_000;

const DATA_URI_BASE64_REGEX =
  /^data:([a-zA-Z0-9][a-zA-Z0-9!#$&\-^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_]*);base64,([A-Za-z0-9+/\-_]+=*)$/;

const RAW_BASE64_REGEX = /^[A-Za-z0-9+/\-_]+=*$/;

function isLargeBase64(value: string): boolean {
  if (value.length < BASE64_CONVERT_MIN_CHARS) return false;
  return DATA_URI_BASE64_REGEX.test(value) || RAW_BASE64_REGEX.test(value);
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
