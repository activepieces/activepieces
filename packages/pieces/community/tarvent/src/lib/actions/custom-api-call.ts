import { createCustomApiCallAction, httpClient, HttpMethod, toFailsafeOutput } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventTransport } from '../common/transport';
import { tarventOutputSchemas } from '../output-schemas';

const base = createCustomApiCallAction({
  auth: tarventAuth,
  baseUrl: () => tarventTransport.baseUrl,
  authMapping: async (auth) => tarventTransport.authHeaders(auth.props),
});

export const tarventCustomApiCall = createAction({
  auth: tarventAuth,
  name: base.name,
  displayName: base.displayName,
  description: 'Send a raw GraphQL request to Tarvent (POST /graphql with a JSON body of query and variables). The API key and account ID headers are added for you. Note: Tarvent reports GraphQL errors with HTTP 200, so check body.errors.',
  audience: 'human',
  classification: 'WRITE',
  outputSchema: tarventOutputSchemas.customApiCall,
  aiMetadata: {
    description:
      'Sends any request to the Tarvent API at https://api.tarvent.com (normally POST /graphql with a query and variables) using the connection API key and account ID, for operations the other actions do not cover. Returns the status, headers and body; GraphQL errors appear in body.errors with HTTP 200. Can change data when the query is a mutation.',
    idempotent: false,
  },
  props: base.props,
  propertyGroups: base.propertyGroups,
  async run({ auth, propsValue, files }) {
    const method = methodOf({ value: propsValue.method });
    const url = urlOf({ value: propsValue.url });
    const request = {
      method,
      url,
      headers: {
        ...stringRecord({ value: propsValue.headers }),
        ...tarventTransport.authHeaders(auth.props),
      },
      queryParams: stringRecord({ value: propsValue.queryParams }),
      timeout: typeof propsValue.timeout === 'number' && propsValue.timeout > 0 ? propsValue.timeout * 1000 : 0,
      followRedirects: propsValue.followRedirects === true,
      body: bodyOf({ body: propsValue.body, bodyType: propsValue.body_type }),
      responseType: propsValue.response_is_binary ? ('arraybuffer' as const) : ('json' as const),
    };
    try {
      const response = await httpClient.sendRequest(request, { dispatcher: await tarventTransport.verifiedTls() });
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
    const parsed = new URL(text, tarventTransport.baseUrl);
    if (parsed.origin !== tarventTransport.baseUrl || parsed.username || parsed.password) {
      throw new Error(`The URL must be on ${tarventTransport.baseUrl}, so your Tarvent API key is not sent anywhere else.`);
    }
    return parsed.toString();
  }
  return `${tarventTransport.baseUrl}/${text.replace(/^\/+/, '')}`;
}

function stringRecord({ value }: { value: unknown }): Record<string, string> {
  if (typeof value !== 'object' || value === null) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, entry]) =>
      entry === undefined || entry === null ? [] : [[key, typeof entry === 'string' ? entry : JSON.stringify(entry)]]
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
