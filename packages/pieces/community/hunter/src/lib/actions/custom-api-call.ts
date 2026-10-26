import { createCustomApiCallAction, HttpMethod, HttpRequest, httpClient, toFailsafeOutput } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { hunterAuth } from '../auth';
import { BASE_URL, apiKeyOf, authHeaders, isRecord, verifiedTlsDispatcher } from '../common/client';

const base = createCustomApiCallAction({
  auth: hunterAuth,
  baseUrl: () => BASE_URL,
  authMapping: async (auth) => authHeaders(apiKeyOf(auth)),
});

export const hunterCustomApiCallAction = createAction({
  auth: hunterAuth,
  name: 'custom_api_call',
  displayName: base.displayName,
  description: base.description,
  props: base.props,
  propertyGroups: base.propertyGroups,
  classification: 'WRITE',
  audience: 'human',
  aiMetadata: {
    description:
      'Sends a raw authenticated request to the Hunter API v2 (https://api.hunter.io/v2). Needs a method and a path relative to that base; absolute URLs on other hosts are refused. Returns the HTTP status, response headers and body.',
    idempotent: false,
  },
  async run({ auth, propsValue, files }) {
    const method = methodOf(propsValue['method']);
    const url = hunterUrlOf(urlOf(propsValue['url']));
    const timeout = propsValue['timeout'];
    const request: HttpRequest = {
      method,
      url,
      headers: { ...stringMap(propsValue['headers']), ...authHeaders(apiKeyOf(auth)) },
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
      const response = await httpClient.sendRequest(request, { dispatcher: await verifiedTlsDispatcher() });
      const data: unknown = response.body;
      if (binary && (data instanceof ArrayBuffer || Buffer.isBuffer(data))) {
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(new Uint8Array(data));
        return { status: response.status, headers: response.headers, body: await files.write({ fileName: 'output.bin', data: buffer }) };
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

export function hunterUrlOf(url: string): string {
  if (url === '') {
    throw new Error('URL is required.');
  }
  if (url.split(/[/?#\\]/).some((part) => part === '..' || /^%2e%2e$/i.test(part) || part === '.')) {
    throw new Error('The URL must not contain "." or ".." segments.');
  }
  const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//') || url.startsWith('\\');
  if (!isAbsolute) {
    return `${BASE_URL}/${url.replace(/^\/+/, '')}`;
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('The URL is not valid.');
  }
  const allowed = new URL(BASE_URL);
  const onHunter =
    parsed.protocol === allowed.protocol &&
    parsed.host === allowed.host &&
    parsed.username === '' &&
    parsed.password === '' &&
    (parsed.pathname === allowed.pathname || parsed.pathname.startsWith(`${allowed.pathname}/`));
  if (!onHunter) {
    throw new Error(`The URL must start with ${BASE_URL}/ or be a path relative to it.`);
  }
  return parsed.toString();
}

function urlOf(value: unknown): string {
  return isRecord(value) && typeof value['url'] === 'string' ? value['url'].trim() : '';
}

function methodOf(value: unknown): HttpMethod {
  const method = Object.values(HttpMethod).find((candidate) => candidate === value);
  if (!method) {
    throw new Error('Method is required.');
  }
  return method;
}

function stringMap(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {};
  }
  const entries: [string, string][] = [];
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'string') {
      entries.push([key, item]);
    } else if (typeof item === 'number' || typeof item === 'boolean') {
      entries.push([key, String(item)]);
    }
  }
  return Object.fromEntries(entries.filter(([key]) => key.toLowerCase() !== 'x-api-key'));
}

function bodyOf({ body, bodyType }: { body: unknown; bodyType: unknown }): HttpRequest['body'] {
  if (body === undefined || body === null) {
    return undefined;
  }
  if (!bodyType) {
    return isRecord(body) || Array.isArray(body) || typeof body === 'string' ? body : undefined;
  }
  if (bodyType === 'none' || !isRecord(body)) {
    return undefined;
  }
  const data = body['data'];
  if (bodyType !== 'form_data') {
    return isRecord(data) || Array.isArray(data) || typeof data === 'string' ? data : undefined;
  }
  const form = new FormData();
  for (const field of Array.isArray(data) ? data : []) {
    if (!isRecord(field) || typeof field['fieldName'] !== 'string') {
      continue;
    }
    const text = field['textFieldValue'];
    const file = isRecord(field['fileFieldValue']) ? field['fileFieldValue'] : {};
    if (field['fieldType'] === 'text' && typeof text === 'string' && text !== '') {
      form.append(field['fieldName'], text);
    } else if (field['fieldType'] === 'file' && Buffer.isBuffer(file['data'])) {
      form.append(field['fieldName'], new Blob([new Uint8Array(file['data'])]), typeof file['filename'] === 'string' ? file['filename'] : undefined);
    }
  }
  return form;
}
