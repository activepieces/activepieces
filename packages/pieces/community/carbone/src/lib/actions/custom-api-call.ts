import {
  HttpMethod,
  HttpRequest,
  createCustomApiCallAction,
  httpClient,
  toFailsafeOutput,
} from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { carboneAuth } from '../auth';
import { CARBONE_API_URL, CARBONE_VERSION } from '../common/constants';

const base = createCustomApiCallAction({
  auth: carboneAuth,
  baseUrl: () => CARBONE_API_URL,
  authMapping: async () => ({}),
});

export const carboneCustomApiCall = createAction({
  auth: carboneAuth,
  name: 'custom_api_call',
  displayName: 'Custom API Call',
  description: 'Make a request to any Carbone API endpoint, e.g. /templates. The API key and carbone-version header are added for you.',
  audience: 'human',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sends any request to the Carbone API at https://api.carbone.io with the connection API key, for endpoints the other actions do not cover. Returns the status, headers and body. Can change data or spend render credits depending on the endpoint.',
    idempotent: false,
  },
  props: {
    url: base.props.url,
    method: base.props.method,
    headers: base.props.headers,
    queryParams: base.props.queryParams,
    body_type: base.props.body_type,
    body: base.props.body,
    response_is_binary: base.props.response_is_binary,
    failsafe: base.props.failsafe,
    timeout: base.props.timeout,
    followRedirects: {
      ...base.props.followRedirects,
      description: 'Follow 3xx redirects on api.carbone.io instead of returning them. A redirect to any other host fails the step.',
    },
  },
  propertyGroups: base.propertyGroups,
  async run({ auth, propsValue, files }) {
    const binary = propsValue.response_is_binary === true;
    const followRedirects = propsValue.followRedirects === true;
    let method = methodOf({ value: propsValue.method });
    let body = bodyOf({ body: propsValue.body, bodyType: propsValue.body_type });
    let url = urlOf({ value: propsValue.url });
    let queryParams: Record<string, string> = stringRecord({ value: propsValue.queryParams });
    try {
      for (let hop = 0; ; hop++) {
        const request: HttpRequest = {
          method,
          url,
          headers: {
            ...stringRecord({ value: propsValue.headers }),
            Authorization: `Bearer ${auth.secret_text.trim()}`,
            'carbone-version': CARBONE_VERSION,
          },
          queryParams,
          timeout: typeof propsValue.timeout === 'number' && propsValue.timeout > 0 ? propsValue.timeout * 1000 : 0,
          followRedirects: false,
          body,
          responseType: binary ? 'arraybuffer' : 'json',
          redactBodyInErrors: true,
        };
        const response = await httpClient.sendRequest(request);
        const location = headerValue(response.headers?.['location']);
        if (followRedirects && response.status >= 300 && response.status < 400 && location !== undefined && hop < MAX_REDIRECTS) {
          url = redirectTarget({ location, from: url });
          queryParams = {};
          if (response.status === 303 || ((response.status === 301 || response.status === 302) && method === HttpMethod.POST)) {
            method = HttpMethod.GET;
            body = undefined;
          }
          continue;
        }
        const data: unknown = response.body;
        if (binary && (Buffer.isBuffer(data) || data instanceof ArrayBuffer)) {
          const buffer = Buffer.isBuffer(data) ? data : Buffer.from(new Uint8Array(data));
          return { status: response.status, headers: response.headers, body: await files.write({ fileName: 'output.bin', data: buffer }) };
        }
        return { status: response.status, headers: response.headers, body: data };
      }
    } catch (error) {
      if (propsValue.failsafe === true) {
        return toFailsafeOutput({ error, requestBody: '[redacted]' });
      }
      throw error;
    }
  },
});
function redirectTarget({ location, from }: { location: string; from: string }): string {
  const target = new URL(location, from).toString();
  try {
    return urlOf({ value: { url: target } });
  } catch {
    throw new Error(`Carbone redirected the request to ${target}, which is not on ${CARBONE_API_URL}, so it was not followed and your API key was not sent there.`);
  }
}

function headerValue(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : undefined;
  }
  return typeof value === 'string' ? value : undefined;
}

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
  if (text.split(/[/?#]/).some((part) => part.replace(/%2e/gi, '.') === '..')) {
    throw new Error('The URL must not contain ".." segments.');
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(text) || text.startsWith('//')) {
    let parsed: URL;
    try {
      parsed = new URL(text, CARBONE_API_URL);
    } catch {
      throw new Error('The URL is not valid.');
    }
    if (parsed.origin !== CARBONE_API_URL || parsed.username || parsed.password) {
      throw new Error(`The URL must be on ${CARBONE_API_URL}, so your Carbone API key is not sent anywhere else.`);
    }
    return parsed.toString();
  }
  return `${CARBONE_API_URL}/${text.replace(/^\/+/, '')}`;
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
    if (typeof data === 'object' && data !== null) {
      return Object.fromEntries(Object.entries(data));
    }
    return data === undefined || data === null ? undefined : JSON.stringify(data);
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

const MAX_REDIRECTS = 5;
