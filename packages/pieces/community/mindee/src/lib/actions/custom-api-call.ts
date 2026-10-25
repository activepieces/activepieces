import { createCustomApiCallAction, HttpMethod, HttpRequest, httpClient, toFailsafeOutput } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mindeeAuth } from '../auth';
import { MINDEE_V2_BASE_URL, isRecord, normalizeApiKey, verifiedTls } from '../common/client';

const base = createCustomApiCallAction({
  auth: mindeeAuth,
  baseUrl: () => `${MINDEE_V2_BASE_URL}/v2`,
  authMapping: async () => ({}),
});

export const mindeeCustomApiCall = createAction({
  auth: mindeeAuth,
  name: 'custom_api_call',
  displayName: base.displayName,
  description: base.description,
  props: base.props,
  propertyGroups: base.propertyGroups,
  classification: 'WRITE',
  audience: 'human',
  aiMetadata: {
    description:
      'Send any request to the Mindee API with the connection key, for endpoints the other actions do not cover. Only https://api-v2.mindee.net (v2, relative paths) and https://api.mindee.net (v1) are allowed. Returns status, headers and body. Can spend credits or change data depending on the endpoint.',
    idempotent: false,
  },
  async run({ auth, propsValue, files }) {
    const method = methodOf(propsValue['method']);
    let target = resolveMindeeUrl(urlOf(propsValue['url']));
    const timeout = propsValue['timeout'];
    const followRedirects = propsValue['followRedirects'] === true;
    const binary = propsValue['response_is_binary'] === true;
    const key = normalizeApiKey(auth.secret_text);
    const body = bodyOf({ body: propsValue['body'], bodyType: propsValue['body_type'] });
    try {
      for (let hop = 0; ; hop++) {
        const request: HttpRequest = {
          method,
          url: target.toString(),
          headers: { ...stringMap(propsValue['headers']), Authorization: target.host === V1_HOST ? `Token ${key}` : key },
          queryParams: stringMap(propsValue['queryParams']),
          timeout: typeof timeout === 'number' && timeout > 0 ? timeout * 1000 : 0,
          followRedirects: false,
          redactBodyInErrors: true,
          body,
        };
        if (binary) request.responseType = 'arraybuffer';
        const response = await httpClient.sendRequest(request, { dispatcher: await verifiedTls() });
        const location = headerValue(response.headers?.['location']);
        if (followRedirects && response.status >= 300 && response.status < 400 && location !== undefined && hop < MAX_REDIRECTS) {
          target = resolveMindeeUrl(new URL(location, target).toString());
          continue;
        }
        const data: unknown = response.body;
        if (binary && (data instanceof ArrayBuffer || Buffer.isBuffer(data))) {
          const buffer = Buffer.isBuffer(data) ? data : Buffer.from(new Uint8Array(data));
          return { status: response.status, headers: response.headers, body: await files.write({ fileName: 'output.bin', data: buffer }) };
        }
        return { status: response.status, headers: response.headers, body: data };
      }
    } catch (error) {
      if (propsValue['failsafe'] === true) return toFailsafeOutput({ error, requestBody: '[redacted]' });
      throw error;
    }
  },
});

function resolveMindeeUrl(raw: string): URL {
  if (raw === '') throw new Error('URL is required.');
  if (raw.split(/[/?#]/).some((part) => part === '..' || part.toLowerCase() === '%2e%2e')) {
    throw new Error('The URL must not contain ".." segments.');
  }
  const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('//');
  let url: URL;
  try {
    url = isAbsolute ? new URL(raw) : new URL(`${MINDEE_V2_BASE_URL}/v2/${raw.replace(/^\/+/, '')}`);
  } catch {
    throw new Error('The URL is not valid.');
  }
  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.includes(url.host) || url.username !== '' || url.password !== '') {
    throw new Error(`The URL must be on https://${ALLOWED_HOSTS.join(' or https://')}; the Mindee API key is only sent there.`);
  }
  return url;
}

function urlOf(value: unknown): string {
  const raw = isRecord(value) ? value['url'] : value;
  return typeof raw === 'string' ? raw.trim() : '';
}

function methodOf(value: unknown): HttpMethod {
  const method = Object.values(HttpMethod).find((m) => m === value);
  if (!method) throw new Error('Method is required.');
  return method;
}

function headerValue(raw: unknown): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === 'string' && value.length > 0 ? value : undefined;
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

const V1_HOST = 'api.mindee.net';
const ALLOWED_HOSTS = ['api-v2.mindee.net', V1_HOST];
const MAX_REDIRECTS = 3;

export const mindeeCustomCall = { resolveMindeeUrl };
