import {
  createCustomApiCallAction,
  HttpMethod,
  HttpRequest,
  httpClient,
  toFailsafeOutput,
} from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { posthogAuth } from '../auth';
import { posthogClient, PostHogAuthValue } from '../common/client';

const base = createCustomApiCallAction({
  auth: posthogAuth,
  baseUrl: (auth) => (auth ? posthogClient.apiHostOf(auth.props) : ''),
  authMapping: async (auth, propsValue) => authHeaders({ auth: auth.props, url: urlOf(propsValue['url']) }),
});

export const posthogCustomApiCall = createAction({
  auth: posthogAuth,
  name: 'custom_api_call',
  displayName: base.displayName,
  description: base.description,
  props: base.props,
  propertyGroups: base.propertyGroups,
  classification: 'WRITE',
  audience: 'human',
  async run({ auth, propsValue, files }) {
    const method = methodOf(propsValue['method']);
    const url = urlOf(propsValue['url']);
    if (url === '') throw new Error('URL is required.');
    const timeout = propsValue['timeout'];
    const request: HttpRequest = {
      method,
      url: fullUrlOf({ auth: auth.props, url }),
      headers: { ...stringMap(propsValue['headers']), ...authHeaders({ auth: auth.props, url }) },
      queryParams: stringMap(propsValue['queryParams']),
      timeout: typeof timeout === 'number' && timeout > 0 ? timeout * 1000 : 0,
      followRedirects: propsValue['followRedirects'] === true,
      body: bodyOf({ body: propsValue['body'], bodyType: propsValue['body_type'] }),
    };
    const binary = propsValue['response_is_binary'] === true;
    if (binary) request.responseType = 'arraybuffer';
    try {
      const response = await httpClient.sendRequest(request, { dispatcher: await posthogClient.verifiedTls() });
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

function extensionOf(headers: unknown): string {
  const raw = posthogClient.isRecord(headers) ? headers['content-type'] : undefined;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const type = typeof value === 'string' ? value.split(';')[0].trim().toLowerCase() : '';
  return CONTENT_TYPE_EXTENSIONS[type] ?? 'txt';
}

function urlOf(value: unknown): string {
  return posthogClient.isRecord(value) && typeof value['url'] === 'string' ? value['url'].trim() : '';
}

function methodOf(value: unknown): HttpMethod {
  const method = Object.values(HttpMethod).find((m) => m === value);
  if (!method) throw new Error('Method is required.');
  return method;
}

function stringMap(value: unknown): Record<string, string> {
  if (!posthogClient.isRecord(value)) return {};
  const entries: [string, string][] = [];
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'string') entries.push([key, item]);
    else if (typeof item === 'number' || typeof item === 'boolean' || typeof item === 'bigint') entries.push([key, String(item)]);
  }
  return Object.fromEntries(entries);
}

function authHeaders({ auth, url }: { auth: PostHogAuthValue; url: string }): Record<string, string> {
  const baseUrl = posthogClient.apiHostOf(auth);
  if ((/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')) && !posthogClient.isSameOrigin({ url, baseUrl })) {
    throw new Error('The URL must be on the API Host of the PostHog connection.');
  }
  if (url.split(/[/?#]/).some((part) => part === '..' || part.toLowerCase() === '%2e%2e')) {
    throw new Error('The URL must not contain ".." segments.');
  }
  return { Authorization: `Bearer ${posthogClient.keyOf(auth)}` };
}

function fullUrlOf({ auth, url }: { auth: PostHogAuthValue; url: string }): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${posthogClient.apiHostOf(auth)}/${url.replace(/^\/+/, '')}`;
}

function bodyOf({ body, bodyType }: { body: unknown; bodyType: unknown }): HttpRequest['body'] {
  if (body === undefined || body === null) return undefined;
  if (!bodyType) return posthogClient.isRecord(body) || Array.isArray(body) || typeof body === 'string' ? body : undefined;
  if (bodyType === 'none' || !posthogClient.isRecord(body)) return undefined;
  const data = body['data'];
  if (bodyType !== 'form_data') return posthogClient.isRecord(data) || Array.isArray(data) || typeof data === 'string' ? data : undefined;
  const form = new FormData();
  for (const field of posthogClient.arrayOf(data)) {
    if (!posthogClient.isRecord(field) || typeof field['fieldName'] !== 'string') continue;
    const text = field['textFieldValue'];
    const file = posthogClient.recordOf(field['fileFieldValue']);
    if (field['fieldType'] === 'text' && typeof text === 'string' && text !== '') form.append(field['fieldName'], text);
    else if (field['fieldType'] === 'file' && Buffer.isBuffer(file['data'])) {
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
