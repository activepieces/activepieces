import { createCustomApiCallAction, httpClient, HttpMethod, toFailsafeOutput } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { firefliesAiAuth } from '../auth';
import { firefliesClient } from '../common/client';
import { firefliesOutputSchemas } from '../output-schemas';

const base = createCustomApiCallAction({
  auth: firefliesAiAuth,
  baseUrl: () => API_ORIGIN,
  authMapping: async (auth) => ({ Authorization: `Bearer ${auth.secret_text.trim()}` }),
});

const { followRedirects: _followRedirects, ...props } = base.props;

export const firefliesCustomApiCall = createAction({
  auth: firefliesAiAuth,
  name: base.name,
  displayName: base.displayName,
  description: 'Make a request to the Fireflies API, e.g. POST /graphql with a GraphQL query. The API key is added for you.',
  audience: 'human',
  classification: 'WRITE',
  outputSchema: firefliesOutputSchemas.customApiCall,
  aiMetadata: {
    description:
      'Sends any request to the Fireflies API at https://api.fireflies.ai with the connection API key, usually POST /graphql with a GraphQL query or mutation the other actions do not cover. Returns the status, headers and body. Can change data depending on the query.',
    idempotent: false,
  },
  props,
  propertyGroups: base.propertyGroups,
  async run({ auth, propsValue, files }) {
    const method = methodOf({ value: propsValue.method });
    const url = urlOf({ value: propsValue.url });
    const request = {
      method,
      url,
      headers: {
        ...withoutAuthorization({ headers: stringRecord({ value: propsValue.headers }) }),
        Authorization: `Bearer ${auth.secret_text.trim()}`,
      },
      queryParams: stringRecord({ value: propsValue.queryParams }),
      timeout: typeof propsValue.timeout === 'number' && propsValue.timeout > 0 ? propsValue.timeout * 1000 : 0,
      followRedirects: false,
      body: bodyOf({ body: propsValue.body, bodyType: propsValue.body_type }),
      responseType: propsValue.response_is_binary ? ('arraybuffer' as const) : ('json' as const),
      redactBodyInErrors: true,
    };
    try {
      const response = await httpClient.sendRequest(request, { dispatcher: await firefliesClient.verifiedTlsDispatcher() });
      const data: unknown = response.body;
      if (propsValue.response_is_binary && (Buffer.isBuffer(data) || data instanceof ArrayBuffer)) {
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(new Uint8Array(data));
        return { status: response.status, headers: response.headers, body: await files.write({ fileName: 'output.bin', data: buffer }) };
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

function methodOf({ value }: { value: unknown }): HttpMethod {
  const method = Object.values(HttpMethod).find((option) => option === value);
  if (!method) {
    throw new Error('Method is required.');
  }
  return method;
}

function urlOf({ value }: { value: unknown }): string {
  const raw = typeof value === 'object' && value !== null ? Reflect.get(value, 'url') : undefined;
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (text.length === 0) {
    throw new Error('URL is required.');
  }
  if (text.split(/[/?#]/).some((part) => part === '..' || part.toLowerCase() === '%2e%2e')) {
    throw new Error('The URL must not contain ".." segments.');
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(text) || text.startsWith('//')) {
    const parsed = new URL(text, API_ORIGIN);
    if (parsed.origin !== API_ORIGIN || parsed.username || parsed.password) {
      throw new Error(`The URL must be on ${API_ORIGIN}, so your Fireflies API key is not sent anywhere else.`);
    }
    return parsed.toString();
  }
  return `${API_ORIGIN}/${text.replace(/^\/+/, '')}`;
}

function stringRecord({ value }: { value: unknown }): Record<string, string> {
  if (typeof value !== 'object' || value === null) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, entry]) =>
      entry === undefined || entry === null ? [] : [[key, typeof entry === 'string' ? entry : JSON.stringify(entry)]],
    ),
  );
}

function withoutAuthorization({ headers }: { headers: Record<string, string> }): Record<string, string> {
  return Object.fromEntries(Object.entries(headers).filter(([key]) => key.trim().toLowerCase() !== 'authorization'));
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

export const firefliesCustomApiCallInternals = { urlOf };

const API_ORIGIN = 'https://api.fireflies.ai';
