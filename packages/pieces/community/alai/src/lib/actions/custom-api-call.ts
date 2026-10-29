import { createCustomApiCallAction, httpClient, HttpMethod, toFailsafeOutput } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { alaiAuth } from '../common/auth';
import { alaiClient } from '../common/client';
import { alaiOutputSchemas } from '../common/output-schemas';

const API_ROOT = `${alaiClient.baseUrl}/api`;

const base = createCustomApiCallAction({
  auth: alaiAuth,
  baseUrl: () => `${API_ROOT}/v1`,
  authMapping: async (auth) => alaiClient.authHeaders(auth.props.apiKey),
});

export const alaiCustomApiCall = createAction({
  auth: alaiAuth,
  name: base.name,
  displayName: base.displayName,
  description: 'Make a request to any Alai API endpoint, e.g. /themes (Classic v1) or /modern/v1/ping. The API key is added for you.',
  audience: 'human',
  classification: 'WRITE',
  outputSchema: alaiOutputSchemas.customApiCall,
  aiMetadata: {
    description:
      'Sends any request to the Alai API under https://slides-api.getalai.com/api (Classic /v1 and Modern /modern/v1) with the connection API key, for endpoints the other actions do not cover. Returns status, headers and body. Can change data or use credits depending on the endpoint.',
    idempotent: false,
  },
  props: base.props,
  propertyGroups: base.propertyGroups,
  async run({ auth, propsValue, files }) {
    const request = {
      method: methodOf(propsValue.method),
      url: urlOf(propsValue.url),
      headers: { ...stringRecord(propsValue.headers), ...alaiClient.authHeaders(auth.props.apiKey) },
      queryParams: stringRecord(propsValue.queryParams),
      timeout: typeof propsValue.timeout === 'number' && propsValue.timeout > 0 ? propsValue.timeout * 1000 : 0,
      followRedirects: false,
      body: bodyOf({ body: propsValue.body, bodyType: propsValue.body_type }),
      responseType: propsValue.response_is_binary ? ('arraybuffer' as const) : ('json' as const),
    };
    try {
      const response = await httpClient.sendRequest(request, { dispatcher: await alaiClient.verifiedTls() });
      const data: unknown = response.body;
      if (propsValue.response_is_binary && (Buffer.isBuffer(data) || data instanceof ArrayBuffer)) {
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(new Uint8Array(data));
        return {
          status: response.status,
          headers: response.headers,
          body: await files.write({ fileName: `output.${extensionOf(response.headers?.['content-type'])}`, data: buffer }),
        };
      }
      return { status: response.status, headers: response.headers, body: data };
    } catch (error) {
      if (propsValue.failsafe) {
        return toFailsafeOutput({ error, requestBody: request.body });
      }
      throw error;
    }
  },
});

function methodOf(value: unknown): HttpMethod {
  const method = Object.values(HttpMethod).find((option) => option === value);
  if (!method) {
    throw new Error('Method is required.');
  }
  return method;
}

export function urlOf(value: unknown): string {
  const raw = typeof value === 'object' && value !== null ? Reflect.get(value, 'url') : undefined;
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (text.length === 0) {
    throw new Error('URL is required.');
  }
  if (text.split(/[/?#\\]/).some((part) => part === '..' || part === '.' || /^%2e(%2e)?$/i.test(part) || /%2f|%5c/i.test(part))) {
    throw new Error('The URL must not contain "." or ".." segments or encoded slashes.');
  }
  if (text.includes('\\')) {
    throw new Error('The URL must not contain backslashes.');
  }
  const absolute = /^[a-z][a-z0-9+.-]*:/i.test(text) || text.startsWith('//');
  const parsed = new URL(absolute ? text : relativeUrl(text));
  if (parsed.origin !== alaiClient.baseUrl || parsed.username || parsed.password || !(parsed.pathname === '/api' || parsed.pathname.startsWith('/api/'))) {
    throw new Error(`The URL must be under ${API_ROOT}, so your Alai API key is not sent anywhere else.`);
  }
  return parsed.toString();
}

function relativeUrl(text: string): string {
  const path = text.replace(/^\/+/, '');
  if (/^(v1|modern\/v1)(\/|$|\?)/.test(path)) {
    return `${API_ROOT}/${path}`;
  }
  return `${API_ROOT}/v1/${path}`;
}

function extensionOf(contentType: unknown): string {
  const raw = Array.isArray(contentType) ? contentType[0] : contentType;
  const type = typeof raw === 'string' ? raw.split(';')[0].trim().toLowerCase() : '';
  return CONTENT_TYPE_EXTENSIONS[type] ?? 'txt';
}

const CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/json': 'json',
  'application/zip': 'zip',
  'application/octet-stream': 'bin',
  'text/plain': 'txt',
  'text/html': 'html',
  'text/csv': 'csv',
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
};

function stringRecord(value: unknown): Record<string, string> {
  if (typeof value !== 'object' || value === null) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, entry]) =>
      entry === undefined || entry === null || key.toLowerCase() === 'authorization' || key.toLowerCase() === 'api-key'
        ? []
        : [[key, typeof entry === 'string' ? entry : JSON.stringify(entry)]]
    )
  );
}

function bodyOf({ body, bodyType }: { body: unknown; bodyType: unknown }): FormData | string | Record<string, unknown> | unknown[] | undefined {
  if (!bodyType || bodyType === 'none' || typeof body !== 'object' || body === null) {
    return undefined;
  }
  const data: unknown = Reflect.get(body, 'data');
  if (bodyType === 'raw') {
    return typeof data === 'string' ? data : undefined;
  }
  if (bodyType === 'json') {
    if (Array.isArray(data)) {
      return data;
    }
    return typeof data === 'object' && data !== null ? Object.fromEntries(Object.entries(data)) : undefined;
  }
  if (bodyType === 'form_data' && Array.isArray(data)) {
    const form = new FormData();
    for (const field of data) {
      const name: unknown = Reflect.get(field, 'fieldName');
      const textValue: unknown = Reflect.get(field, 'textFieldValue');
      const file: unknown = Reflect.get(field, 'fileFieldValue');
      if (typeof name !== 'string') {
        continue;
      }
      if (Reflect.get(field, 'fieldType') === 'file' && typeof file === 'object' && file !== null) {
        const fileData: unknown = Reflect.get(file, 'data');
        const filename: unknown = Reflect.get(file, 'filename');
        if (Buffer.isBuffer(fileData)) {
          form.append(name, new Blob([new Uint8Array(fileData)]), typeof filename === 'string' ? filename : 'file');
        }
      } else if (typeof textValue === 'string') {
        form.append(name, textValue);
      }
    }
    return form;
  }
  return undefined;
}
