import {
  createCustomApiCallAction,
  HttpMethod,
  HttpRequest,
  httpClient,
  toFailsafeOutput,
} from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { cognitoFormsAuth } from '../auth';
import { COGNITO_API_BASE, isRecord, verifiedTls } from '../common/client';

const base = createCustomApiCallAction({
  auth: cognitoFormsAuth,
  baseUrl: () => COGNITO_API_BASE,
  authMapping: async (auth) => ({ Authorization: `Bearer ${auth.secret_text}` }),
});

export const customApiCallAction = createAction({
  auth: cognitoFormsAuth,
  name: 'custom_api_call',
  displayName: base.displayName,
  description: base.description,
  props: base.props,
  propertyGroups: base.propertyGroups,
  classification: 'WRITE',
  audience: 'human',
  aiMetadata: {
    description:
      'Send any request to the Cognito Forms API (https://www.cognitoforms.com/api) with the connection key, for endpoints the other actions do not cover. Returns status, headers and body. Can change or delete data depending on the method and path.',
    idempotent: false,
  },
  async run({ auth, propsValue, files }) {
    const method = methodOf(propsValue['method']);
    const url = urlOf(propsValue['url']);
    if (url === '') throw new Error('URL is required.');
    const fullUrl = fullUrlOf(url);
    const timeout = propsValue['timeout'];
    const request: HttpRequest = {
      method,
      url: fullUrl,
      headers: { ...stringMap(propsValue['headers']), Authorization: `Bearer ${auth.secret_text}` },
      queryParams: stringMap(propsValue['queryParams']),
      timeout: typeof timeout === 'number' && timeout > 0 ? timeout * 1000 : 0,
      followRedirects: propsValue['followRedirects'] === true,
      body: bodyOf({ body: propsValue['body'], bodyType: propsValue['body_type'] }),
      redactBodyInErrors: true,
    };
    const binary = propsValue['response_is_binary'] === true;
    if (binary) request.responseType = 'arraybuffer';
    try {
      const response = await httpClient.sendRequest(request, { dispatcher: await verifiedTls() });
      const data: unknown = response.body;
      if (binary && (data instanceof ArrayBuffer || Buffer.isBuffer(data))) {
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(new Uint8Array(data));
        return { status: response.status, headers: response.headers, body: await files.write({ fileName: `output.${extensionOf(response.headers)}`, data: buffer }) };
      }
      return { status: response.status, headers: response.headers, body: data };
    } catch (error) {
      if (propsValue['failsafe'] === true) return toFailsafeOutput({ error, requestBody: request.body });
      throw error;
    }
  },
});

function fullUrlOf(url: string): string {
  if (url.split(/[/?#]/).some((part) => part === '..' || part.toLowerCase() === '%2e%2e')) {
    throw new Error('The URL must not contain ".." segments.');
  }
  const absolute = /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//');
  const full = absolute ? url : `${COGNITO_API_BASE}/${url.replace(/^\/+/, '')}`;
  let parsed: URL;
  try {
    parsed = new URL(full, COGNITO_API_BASE);
  } catch {
    throw new Error('The URL is not valid.');
  }
  const allowed = new URL(COGNITO_API_BASE);
  if (parsed.protocol !== 'https:' || parsed.host !== allowed.host) {
    throw new Error(`The URL must be on ${allowed.origin}.`);
  }
  return parsed.toString();
}

function urlOf(value: unknown): string {
  return isRecord(value) && typeof value['url'] === 'string' ? value['url'].trim() : '';
}

function methodOf(value: unknown): HttpMethod {
  const method = Object.values(HttpMethod).find((m) => m === value);
  if (!method) throw new Error('Method is required.');
  return method;
}

function stringMap(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  const entries: [string, string][] = [];
  for (const [key, item] of Object.entries(value)) {
    if (key.toLowerCase() === 'authorization') continue;
    if (typeof item === 'string') entries.push([key, item]);
    else if (typeof item === 'number' || typeof item === 'boolean' || typeof item === 'bigint') entries.push([key, String(item)]);
  }
  return Object.fromEntries(entries);
}

function bodyOf({ body, bodyType }: { body: unknown; bodyType: unknown }): HttpRequest['body'] {
  if (body === undefined || body === null) return undefined;
  if (!bodyType) return isRecord(body) || Array.isArray(body) || typeof body === 'string' ? body : undefined;
  if (bodyType === 'none' || !isRecord(body)) return undefined;
  const data = body['data'];
  if (bodyType !== 'form_data') return isRecord(data) || Array.isArray(data) || typeof data === 'string' ? data : undefined;
  const form = new FormData();
  for (const field of Array.isArray(data) ? data : []) {
    if (!isRecord(field) || typeof field['fieldName'] !== 'string') continue;
    const text = field['textFieldValue'];
    const file = isRecord(field['fileFieldValue']) ? field['fileFieldValue'] : {};
    if (field['fieldType'] === 'text' && typeof text === 'string' && text !== '') form.append(field['fieldName'], text);
    else if (field['fieldType'] === 'file' && Buffer.isBuffer(file['data'])) {
      form.append(field['fieldName'], new Blob([new Uint8Array(file['data'])]), typeof file['filename'] === 'string' ? file['filename'] : undefined);
    }
  }
  return form;
}

function extensionOf(headers: unknown): string {
  const raw = isRecord(headers) ? headers['content-type'] : undefined;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const type = typeof value === 'string' ? value.split(';')[0].trim().toLowerCase() : '';
  return CONTENT_TYPE_EXTENSIONS[type] ?? 'txt';
}

const CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
  'application/json': 'json',
  'application/pdf': 'pdf',
  'application/xml': 'xml',
  'text/xml': 'xml',
  'application/zip': 'zip',
  'application/gzip': 'gz',
  'application/x-tar': 'tar',
  'application/octet-stream': 'bin',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/rtf': 'rtf',
  'application/javascript': 'js',
  'application/x-www-form-urlencoded': 'bin',
  'text/plain': 'txt',
  'text/html': 'html',
  'text/css': 'css',
  'text/csv': 'csv',
  'text/calendar': 'ics',
  'text/markdown': 'md',
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
  'image/heic': 'heic',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/webm': 'weba',
  'video/mp4': 'mp4',
  'video/mpeg': 'mpeg',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
  'font/woff': 'woff',
  'font/woff2': 'woff2',
  'font/ttf': 'ttf',
  'font/otf': 'otf',
};
