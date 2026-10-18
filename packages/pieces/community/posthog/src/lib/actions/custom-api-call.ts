import {
  createCustomApiCallAction,
  HttpHeaders,
  HttpMethod,
  HttpRequest,
  httpClient,
  QueryParams,
  toFailsafeOutput,
} from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { posthogAuth } from '../auth';
import { posthogClient, PostHogAuthValue } from '../common/client';

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

type FormField = { fieldName: string; fieldType: 'text' | 'file'; textFieldValue?: string; fileFieldValue?: { data: Buffer; filename?: string } };

function bodyOf({ body, bodyType }: { body: unknown; bodyType: unknown }): unknown {
  if (body === undefined || body === null) return undefined;
  if (!bodyType) return body;
  if (bodyType === 'none' || !posthogClient.isRecord(body)) return undefined;
  const data = body['data'];
  if (bodyType !== 'form_data') return data;
  const form = new FormData();
  for (const field of posthogClient.arrayOf(data) as FormField[]) {
    if (field.fieldType === 'text' && field.textFieldValue) form.append(field.fieldName, field.textFieldValue);
    else if (field.fieldType === 'file' && field.fileFieldValue) {
      form.append(field.fieldName, new Blob([new Uint8Array(field.fileFieldValue.data)]), field.fileFieldValue.filename);
    }
  }
  return form;
}

const base = createCustomApiCallAction({
  auth: posthogAuth,
  baseUrl: (auth) => (auth ? posthogClient.apiHostOf(auth.props) : ''),
  authMapping: async (auth, propsValue) => {
    const urlProp = propsValue['url'];
    const url = posthogClient.isRecord(urlProp) && typeof urlProp['url'] === 'string' ? urlProp['url'].trim() : '';
    return authHeaders({ auth: auth.props, url });
  },
});

// Same props as the shared Custom API Call, but the request goes through the
// certificate-checked dispatcher: the shared helper's httpClient call runs with
// NODE_TLS_REJECT_UNAUTHORIZED=0 and would send the API key without TLS checks.
export const posthogCustomApiCall = createAction({
  auth: posthogAuth,
  name: base.name,
  displayName: base.displayName,
  description: base.description,
  props: base.props,
  propertyGroups: base.propertyGroups,
  classification: base.classification,
  async run({ auth, propsValue, files }) {
    const { method, url, headers, queryParams, body, body_type, failsafe, timeout, response_is_binary, followRedirects } = propsValue;
    if (!method) throw new Error('Method is required.');
    const urlValue = posthogClient.isRecord(url) && typeof url['url'] === 'string' ? url['url'].trim() : '';
    if (urlValue === '') throw new Error('URL is required.');
    const request: HttpRequest = {
      method: method as HttpMethod,
      url: fullUrlOf({ auth: auth.props, url: urlValue }),
      headers: { ...((headers ?? {}) as HttpHeaders), ...authHeaders({ auth: auth.props, url: urlValue }) },
      queryParams: (queryParams ?? {}) as QueryParams,
      timeout: typeof timeout === 'number' && timeout > 0 ? timeout * 1000 : 0,
      followRedirects: followRedirects === true,
      body: bodyOf({ body, bodyType: body_type }) as HttpRequest['body'],
    };
    if (response_is_binary) request.responseType = 'arraybuffer';
    try {
      const dispatcher = await posthogClient.verifiedTls();
      const response = await httpClient.sendRequest(request, { dispatcher });
      const data = response.body as unknown;
      if (response_is_binary && (data instanceof ArrayBuffer || Buffer.isBuffer(data))) {
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(new Uint8Array(data));
        return { status: response.status, headers: response.headers, body: await files.write({ fileName: 'output.bin', data: buffer }) };
      }
      return { status: response.status, headers: response.headers, body: data };
    } catch (error) {
      if (failsafe) return toFailsafeOutput({ error, requestBody: request.body });
      throw error;
    }
  },
});
