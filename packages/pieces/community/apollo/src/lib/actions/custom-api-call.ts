import { HttpMethod, HttpRequest, createCustomApiCallAction, httpClient, toFailsafeOutput } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../auth';
import { apiKeyOf, verifiedTlsDispatcher } from '../common/client';
import { apolloOutputSchemas } from '../common/output-schemas';

const base = createCustomApiCallAction({
  auth: apolloAuth,
  baseUrl: () => API_BASE_URL,
  authMapping: async (auth) => ({ 'x-api-key': apiKeyOf(auth) }),
});

const { followRedirects: _followRedirects, ...props } = base.props;

export const apolloCustomApiCall = createAction({
  auth: apolloAuth,
  name: base.name,
  displayName: base.displayName,
  description: 'Make a request to any Apollo API endpoint, e.g. GET /contacts/{id}. The API key is added for you. Needs a master API key or a key scoped to that endpoint.',
  audience: 'human',
  classification: 'WRITE',
  outputSchema: apolloOutputSchemas.customApiCall,
  aiMetadata: {
    description:
      'Sends any request to the Apollo REST API at https://api.apollo.io/api/v1 with the connection API key, for endpoints the other actions do not cover. Returns the status, headers and body. Can create or change data and spend credits depending on the endpoint.',
    idempotent: false,
  },
  props,
  propertyGroups: base.propertyGroups?.map((group) => ({ ...group, props: group.props.filter((key) => key !== 'followRedirects') })),
  async run({ auth, propsValue, files }) {
    const binary = propsValue.response_is_binary === true;
    const request: HttpRequest = {
      method: methodOf({ value: propsValue.method }),
      url: urlOf({ value: propsValue.url }),
      headers: { ...withoutApiKey({ headers: stringRecord({ value: propsValue.headers }) }), 'x-api-key': apiKeyOf(auth) },
      queryParams: stringRecord({ value: propsValue.queryParams }),
      timeout: typeof propsValue.timeout === 'number' && propsValue.timeout > 0 ? propsValue.timeout * 1000 : 0,
      followRedirects: false,
      body: bodyOf({ body: propsValue.body, bodyType: propsValue.body_type }),
      responseType: binary ? 'arraybuffer' : 'json',
      redactBodyInErrors: true,
    };
    try {
      const response = await httpClient.sendRequest(request, { dispatcher: await verifiedTlsDispatcher() });
      const data: unknown = response.body;
      if (binary && (Buffer.isBuffer(data) || data instanceof ArrayBuffer)) {
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(new Uint8Array(data));
        return { status: response.status, headers: response.headers, body: await files.write({ fileName: 'output.bin', data: buffer }) };
      }
      return { status: response.status, headers: response.headers, body: data };
    } catch (error) {
      if (propsValue.failsafe) {
        return toFailsafeOutput({ error, requestBody: '[redacted]' });
      }
      throw error;
    }
  },
});

function methodOf({ value }: { value: unknown }): HttpMethod {
  const method = Object.values(HttpMethod).find((option) => option === value);
  if (!method) {
    throw new Error('Method is required.');
  }
  return method;
}

function urlOf({ value }: { value: unknown }): string {
  const raw = typeof value === 'object' && value !== null ? Reflect.get(value, 'url') : value;
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (text.length === 0) {
    throw new Error('URL is required.');
  }
  if (text.includes('\\') || hasDotSegment({ path: text.split(/[?#]/)[0] })) {
    throw new Error('The URL must not contain "." or ".." path segments (plain or %2e-encoded) or backslashes.');
  }
  if (text.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(text)) {
    const parsed = text.startsWith('//') ? undefined : new URL(text);
    if (parsed === undefined || parsed.origin !== API_ORIGIN || parsed.username !== '' || parsed.password !== '') {
      throw new Error(`The URL must be on ${API_ORIGIN}, so your Apollo API key is not sent anywhere else.`);
    }
    return parsed.toString();
  }
  const joined = new URL(`${API_BASE_URL}/${text.replace(/^\/+/, '')}`);
  if (joined.origin !== API_ORIGIN || !joined.pathname.startsWith(`${new URL(API_BASE_URL).pathname}/`)) {
    throw new Error(`The URL must be a path under ${API_BASE_URL}.`);
  }
  return joined.toString();
}

function hasDotSegment({ path }: { path: string }): boolean {
  return path.split('/').some((segment) => {
    const decoded = segment.replace(/%2e/gi, '.');
    return decoded === '..' || decoded === '.';
  });
}

function withoutApiKey({ headers }: { headers: Record<string, string> }): Record<string, string> {
  return Object.fromEntries(Object.entries(headers).filter(([key]) => key.trim().toLowerCase() !== 'x-api-key'));
}

function stringRecord({ value }: { value: unknown }): Record<string, string> {
  if (typeof value !== 'object' || value === null) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, entry]) => (entry === undefined || entry === null ? [] : [[key, typeof entry === 'string' ? entry : JSON.stringify(entry)]])),
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
      const text: unknown = Reflect.get(field, 'textFieldValue');
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
      } else if (typeof text === 'string') {
        form.append(name, text);
      }
    }
    return form;
  }
  return undefined;
}

const API_ORIGIN = 'https://api.apollo.io';

const API_BASE_URL = `${API_ORIGIN}/api/v1`;

export const apolloCustomApiCallInternals = { urlOf };
