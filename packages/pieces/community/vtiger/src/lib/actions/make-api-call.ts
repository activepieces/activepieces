import { Property, createAction } from '@activepieces/pieces-framework';
import {
  HttpHeaders,
  HttpMessageBody,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { vtigerAuth } from '../auth';
import {
  basicAuthorization,
  isRecord,
  normalizeInstanceUrl,
  restBaseUrl,
  verifiedTlsDispatcher,
  VtigerCredentials,
} from '../rest-client';
import { vtwsLogin } from '../vtws';

export function resolveCustomCallTarget({
  creds,
  url,
  urlPath,
}: {
  creds: VtigerCredentials;
  url?: string;
  urlPath?: string;
}): { url: string; useRestAuth: boolean } {
  const origin = normalizeInstanceUrl(creds.instance_url);
  const restBase = restBaseUrl(creds);
  if (urlPath && !urlPath.startsWith('/')) {
    throw new Error('URL path must start with a slash, example: /me, /listtypes, /describe');
  }
  if (url) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')) {
      const parsed = parseAbsolute(url);
      if (parsed.origin !== origin || parsed.username !== '' || parsed.password !== '') {
        throw new Error(
          `Absolute URLs must point to the connected instance (${origin}). Use a path such as /me instead.`
        );
      }
      return {
        url: parsed.toString(),
        useRestAuth: parsed.pathname.startsWith('/restapi/'),
      };
    }
    return { url: `${restBase}${url.startsWith('/') ? url : `/${url}`}`, useRestAuth: true };
  }
  if (urlPath) {
    return { url: `${restBase}${urlPath}`, useRestAuth: true };
  }
  return { url: `${origin}/webservice.php`, useRestAuth: false };
}

export function customApiCallAuthHeaders({
  creds,
  url,
}: {
  creds: VtigerCredentials;
  url: unknown;
}): { Authorization: string } {
  const value = typeof url === 'string' ? url.trim() : '';
  if (/^https?:\/\//i.test(value)) {
    const parsed = parseAbsolute(value);
    const restBase = new URL(restBaseUrl(creds));
    if (
      parsed.origin !== restBase.origin ||
      parsed.username !== '' ||
      parsed.password !== '' ||
      !`${parsed.pathname}/`.startsWith(`${restBase.pathname}/`)
    ) {
      throw new Error(
        `Absolute URLs must point to the connected instance's REST API (${restBase.toString()}). Use a relative path such as /me instead.`
      );
    }
  }
  return { Authorization: basicAuthorization(creds) };
}

export const makeAPICall = createAction({
  name: 'make_api_call',
  classification: 'WRITE',
  auth: vtigerAuth,
  displayName: 'Custom API Call (Deprecated)',
  description: 'Performs an arbitrary authorized API call. (Deprecated)',
  audience: 'human',
  aiMetadata: {
    description:
      'Deprecated. Makes an arbitrary authenticated HTTP call to the connected Vtiger instance, routing to the legacy webservice.php endpoint or the REST base depending on the URL given. Prefer the dedicated actions. Treat write calls as non-idempotent.',
    idempotent: false,
  },
  props: {
    method: Property.StaticDropdown<HttpMethod>({
      displayName: 'Http Method',
      description: 'Select the HTTP method you want to use',
      required: true,
      options: {
        options: [
          { label: 'GET', value: HttpMethod.GET },
          { label: 'POST', value: HttpMethod.POST },
          { label: 'PUT', value: HttpMethod.PUT },
          { label: 'PATCH', value: HttpMethod.PATCH },
          { label: 'DELETE', value: HttpMethod.DELETE },
        ],
      },
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description:
        'Path (e.g. /me, /listtypes, /describe) called against the REST base, or an absolute URL on the connected instance.',
      required: false,
    }),
    urlPath: Property.ShortText({
      displayName: 'URL Path (deprecated)',
      description:
        "Deprecated. Use 'URL' instead. API endpoint's URL path (example: /me, /listtypes, /describe)",
      required: false,
    }),
    headers: Property.Json({
      displayName: 'Headers',
      description: `Enter the desired request headers. Skip the authorization headers`,
      required: false,
      defaultValue: {},
    }),
    data: Property.Json({
      displayName: 'Data',
      description: `Enter the data to pass. if its POST, it will be sent as body data, and if GET, as query string`,
      required: false,
      defaultValue: {},
    }),
  },
  async run({ propsValue, auth }) {
    const method = propsValue.method ?? HttpMethod.GET;
    const target = resolveCustomCallTarget({
      creds: auth.props,
      url: propsValue.url,
      urlPath: propsValue.urlPath,
    });
    const headers = normalizeHeaders(propsValue.headers);
    const hasContentType = Object.keys(headers).some((k) => k.toLowerCase() === 'content-type');
    if (method !== HttpMethod.GET && !hasContentType) {
      headers['Content-Type'] = target.useRestAuth ? 'application/json' : 'application/x-www-form-urlencoded';
    }
    const userData = isRecord(propsValue.data) ? propsValue.data : {};
    const data: Record<string, unknown> = target.useRestAuth
      ? userData
      : { ...userData, sessionName: (await vtwsLogin(auth.props)).sessionName };
    if (target.useRestAuth) {
      headers['Authorization'] = basicAuthorization(auth.props);
    }
    const request: HttpRequest<HttpMessageBody> = { url: target.url, method, headers };
    if (method === HttpMethod.GET) {
      request.queryParams = toQueryParams(data);
    } else {
      const contentType = Object.entries(headers).find(([k]) => k.toLowerCase() === 'content-type')?.[1];
      const ct = Array.isArray(contentType) ? contentType[0] : contentType;
      request.body = target.useRestAuth && ct === 'application/json' ? data : toQueryParams(data);
    }
    const dispatcher = await verifiedTlsDispatcher();
    const response = await httpClient.sendRequest<HttpMessageBody>(request, { dispatcher });
    return response.body;
  },
});

function parseAbsolute(url: string): URL {
  try {
    return new URL(url);
  } catch {
    throw new Error(`"${url}" is not a valid URL`);
  }
}

function normalizeHeaders(h: unknown): HttpHeaders {
  if (!isRecord(h)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(h)
      .filter(([k]) => k.toLowerCase() !== 'authorization')
      .map(([k, v]): [string, string | string[] | undefined] => [
        k,
        v === undefined || v === null
          ? undefined
          : Array.isArray(v)
          ? v.map((x) => String(x))
          : String(v),
      ])
  );
}

function toQueryParams(obj: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])
  );
}
