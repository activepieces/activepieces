import { createCustomApiCallAction, HttpMethod, HttpRequest, httpClient, toFailsafeOutput } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { pastefyAuth } from '../common/auth';
import { pastefyClient, PastefyAuthValue } from '../common/client';

const base = createCustomApiCallAction({
  auth: pastefyAuth,
  baseUrl: (auth) => (auth ? pastefyClient.apiBase({ auth }) : ''),
  authMapping: async (auth) => authHeadersOf({ auth }),
  props: {
    followRedirects: {
      description: 'Has no effect here: redirects are never followed, so the API key is not sent to another host.',
    },
  },
});

export const pastefyCustomApiCallAction = createAction({
  auth: pastefyAuth,
  name: 'custom_api_call',
  displayName: base.displayName,
  description: base.description,
  props: base.props,
  propertyGroups: base.propertyGroups,
  classification: 'WRITE',
  audience: 'human',
  aiMetadata: {
    description:
      'Sends a raw request to the Pastefy API v2 of the connected instance (<instance>/api/v2), with the API key when the connection has one. Needs a method and a path relative to that base; absolute URLs outside it are refused. Returns the HTTP status, response headers and body.',
    idempotent: false,
  },
  async run({ auth, propsValue, files }) {
    const method = methodOf(propsValue['method']);
    const url = apiUrlOf({ baseUrl: pastefyClient.apiBase({ auth }), url: urlOf(propsValue['url']) });
    const timeout = propsValue['timeout'];
    const request: HttpRequest = {
      method,
      url,
      headers: { ...withoutAuthHeader(stringMap(propsValue['headers'])), ...authHeadersOf({ auth }) },
      queryParams: stringMap(propsValue['queryParams']),
      timeout: typeof timeout === 'number' && timeout > 0 ? timeout * 1000 : 0,
      followRedirects: false,
      body: bodyOf({ body: propsValue['body'], bodyType: propsValue['body_type'] }),
    };
    const binary = propsValue['response_is_binary'] === true;
    if (binary) {
      request.responseType = 'arraybuffer';
    }
    try {
      const response = await httpClient.sendRequest(request, { dispatcher: await pastefyClient.verifiedTls() });
      const data: unknown = response.body;
      if (binary && (data instanceof ArrayBuffer || Buffer.isBuffer(data))) {
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(new Uint8Array(data));
        return { status: response.status, headers: response.headers, body: await files.write({ fileName: `output.${extensionOf(response.headers)}`, data: buffer }) };
      }
      return { status: response.status, headers: response.headers, body: data };
    } catch (error) {
      if (propsValue['failsafe'] === true) {
        return toFailsafeOutput({ error, requestBody: request.body });
      }
      throw error;
    }
  },
});

export function apiUrlOf({ baseUrl, url }: { baseUrl: string; url: string }): string {
  if (url === '') {
    throw new Error('URL is required.');
  }
  if (url.split(/[/?#\\]/).some((part) => part === '..' || /^%2e%2e$/i.test(part) || part === '.')) {
    throw new Error('The URL must not contain "." or ".." segments.');
  }
  const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//') || url.startsWith('\\');
  if (!isAbsolute) {
    return `${baseUrl}/${url.replace(/^\/+/, '')}`;
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('The URL is not valid.');
  }
  const allowed = new URL(baseUrl);
  const onInstance =
    parsed.protocol === allowed.protocol &&
    parsed.host === allowed.host &&
    parsed.username === '' &&
    parsed.password === '' &&
    (parsed.pathname === allowed.pathname || parsed.pathname.startsWith(`${allowed.pathname}/`));
  if (!onInstance) {
    throw new Error(`The URL must start with ${baseUrl}/ or be a path relative to it.`);
  }
  return parsed.toString();
}

function authHeadersOf({ auth }: { auth: PastefyAuthValue }): Record<string, string> {
  const token = pastefyClient.tokenOf({ auth });
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function urlOf(value: unknown): string {
  return pastefyClient.isRecord(value) && typeof value['url'] === 'string' ? value['url'].trim() : '';
}

function methodOf(value: unknown): HttpMethod {
  const method = Object.values(HttpMethod).find((candidate) => candidate === value);
  if (!method) {
    throw new Error('Method is required.');
  }
  return method;
}

function stringMap(value: unknown): Record<string, string> {
  if (!pastefyClient.isRecord(value)) {
    return {};
  }
  const entries: [string, string][] = [];
  for (const [key, item] of Object.entries(value)) {
    const text = Array.isArray(item) ? item.filter(isScalar).map(String).join(',') : isScalar(item) ? String(item) : undefined;
    if (text !== undefined) {
      entries.push([key, text]);
    }
  }
  return Object.fromEntries(entries);
}

function isScalar(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function withoutAuthHeader(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(headers).filter(([key]) => key.toLowerCase() !== 'authorization'));
}

function extensionOf(headers: unknown): string {
  const raw = pastefyClient.isRecord(headers) ? headers['content-type'] : undefined;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const type = typeof value === 'string' ? value.split(';')[0].trim().toLowerCase() : '';
  return CONTENT_TYPE_EXTENSIONS[type] ?? 'txt';
}

function bodyOf({ body, bodyType }: { body: unknown; bodyType: unknown }): HttpRequest['body'] {
  if (body === undefined || body === null) {
    return undefined;
  }
  if (!bodyType) {
    return pastefyClient.isRecord(body) || Array.isArray(body) || typeof body === 'string' ? body : undefined;
  }
  if (bodyType === 'none' || !pastefyClient.isRecord(body)) {
    return undefined;
  }
  const data = body['data'];
  if (bodyType !== 'form_data') {
    return pastefyClient.isRecord(data) || Array.isArray(data) || typeof data === 'string' ? data : undefined;
  }
  const form = new FormData();
  for (const field of Array.isArray(data) ? data : []) {
    if (!pastefyClient.isRecord(field) || typeof field['fieldName'] !== 'string') {
      continue;
    }
    const text = field['textFieldValue'];
    const file = pastefyClient.isRecord(field['fileFieldValue']) ? field['fileFieldValue'] : {};
    if (field['fieldType'] === 'text' && typeof text === 'string' && text !== '') {
      form.append(field['fieldName'], text);
    } else if (field['fieldType'] === 'file' && Buffer.isBuffer(file['data'])) {
      form.append(field['fieldName'], new Blob([new Uint8Array(file['data'])]), typeof file['filename'] === 'string' ? file['filename'] : undefined);
    }
  }
  return form;
}

const CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
  'application/json': 'json',
  'application/pdf': 'pdf',
  'application/zip': 'zip',
  'application/gzip': 'gz',
  'application/octet-stream': 'bin',
  'application/xml': 'xml',
  'text/xml': 'xml',
  'text/csv': 'csv',
  'text/plain': 'txt',
  'text/html': 'html',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'audio/mpeg': 'mp3',
};
