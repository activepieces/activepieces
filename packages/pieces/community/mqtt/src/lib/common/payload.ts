import { ApFile } from '@activepieces/pieces-framework';

function encode({ format, value }: { format: string; value: unknown }): Buffer {
  switch (format) {
    case 'json':
      return Buffer.from(JSON.stringify(value ?? null), 'utf8');
    case 'base64':
      return decodeBase64({ value: stringValue({ value }) });
    case 'hex':
      return decodeHex({ value: stringValue({ value }) });
    case 'file':
      if (value instanceof ApFile) {
        return value.data;
      }
      throw new Error('Please select a file to publish.');
    default:
      return Buffer.from(stringValue({ value }), 'utf8');
  }
}

function decode({ buffer, format }: { buffer: Buffer; format: string }): DecodedPayload {
  switch (format) {
    case 'json':
      return decodeJsonOrText({ buffer });
    case 'text':
      return { payload: buffer.toString('utf8'), payload_format: 'text' };
    case 'base64':
      return { payload: buffer.toString('base64'), payload_format: 'base64' };
    case 'hex':
      return { payload: buffer.toString('hex'), payload_format: 'hex' };
    default:
      return decodeAuto({ buffer });
  }
}

function decodeToText({ buffer }: { buffer: Buffer | undefined }): string | undefined {
  if (!buffer) {
    return undefined;
  }
  const text = toUtf8({ buffer });
  if (text === undefined || CONTROL_CHARACTERS.test(text)) {
    return buffer.toString('base64');
  }
  return text;
}

function contentTypeFor({ format }: { format: string }): string {
  switch (format) {
    case 'json':
      return 'application/json';
    case 'text':
      return 'text/plain';
    default:
      return 'application/octet-stream';
  }
}

function decodeAuto({ buffer }: { buffer: Buffer }): DecodedPayload {
  const text = toUtf8({ buffer });
  if (text === undefined || CONTROL_CHARACTERS.test(text)) {
    return { payload: buffer.toString('base64'), payload_format: 'base64' };
  }
  const json = parseJsonContainer({ text });
  if (json !== undefined) {
    return { payload: json, payload_format: 'json' };
  }
  return { payload: text, payload_format: 'text' };
}

function decodeJsonOrText({ buffer }: { buffer: Buffer }): DecodedPayload {
  const text = buffer.toString('utf8');
  try {
    const parsed: unknown = JSON.parse(text);
    return { payload: parsed, payload_format: 'json' };
  } catch {
    return { payload: text, payload_format: 'text' };
  }
}

function parseJsonContainer({ text }: { text: string }): unknown {
  const trimmed = text.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(trimmed);
    return parsed;
  } catch {
    return undefined;
  }
}

function toUtf8({ buffer }: { buffer: Buffer }): string | undefined {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    return undefined;
  }
}

function decodeBase64({ value }: { value: string }): Buffer {
  const cleaned = value.replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/_-]*={0,2}$/.test(cleaned)) {
    throw new Error('The payload is not valid Base64.');
  }
  return Buffer.from(cleaned, 'base64');
}

function decodeHex({ value }: { value: string }): Buffer {
  const cleaned = value.replace(/^0x/i, '').replace(/[\s:-]+/g, '');
  if (cleaned.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(cleaned)) {
    throw new Error('The payload is not valid hexadecimal (e.g. 48656c6c6f).');
  }
  return Buffer.from(cleaned, 'hex');
}

function stringValue({ value }: { value: unknown }): string {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
}

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

export const mqttPayload = {
  encode,
  decode,
  decodeToText,
  contentTypeFor,
};

export type DecodedPayload = {
  payload: unknown;
  payload_format: 'json' | 'text' | 'base64' | 'hex';
};
