import { Property, createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../..';
import { instanceLogin } from '../common';
import {
  AuthenticationType,
  HttpHeaders,
  HttpMessageBody,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

//Docs: https://code.vtiger.com/vtiger/vtigercrm-manual/-/wikis/Webservice-Docs
//Extra: https://help.vtiger.com/article/147111249-Rest-API-Manual

export const makeAPICall = createAction({
  name: 'make_api_call',
  auth: vtigerAuth,
  displayName: 'Custom API Call (Deprecated)',
  description: 'Performs an arbitrary authorized API call. (Deprecated)',
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
        'Absolute URL or path. If a relative path is provided (e.g., /me, /listtypes, /describe), it will be called against the REST base.',
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
    const urlPath = propsValue.urlPath;
    const url = propsValue.url;

    if (urlPath && !urlPath.startsWith('/')) {
      return {
        error:
          'URL path must start with a slash, example: /me, /listtypes, /describe',
      };
    }

    let finalUrl = `${auth.instance_url}/webservice.php`;
    let useRestAuth = false;

    if (url) {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        finalUrl = url;
      } else if (url.startsWith('/')) {
        finalUrl = `${auth.instance_url}/restapi/v1/vtiger/default${url}`;
        useRestAuth = true;
      } else {
        finalUrl = `${auth.instance_url}/restapi/v1/vtiger/default/${url}`;
        useRestAuth = true;
      }
    } else if (urlPath) {
      finalUrl = `${auth.instance_url}/restapi/v1/vtiger/default${urlPath}`;
      useRestAuth = true;
    }

    const normalizeHeaders = (h: unknown): HttpHeaders => {
      const out: HttpHeaders = {};
      if (h && typeof h === 'object' && !Array.isArray(h)) {
        for (const [k, v] of Object.entries(h as Record<string, unknown>)) {
          if (v === undefined || v === null) {
            out[k] = undefined;
          } else if (Array.isArray(v)) {
            out[k] = (v as unknown[]).map((x) => String(x));
          } else if (typeof v === 'string') {
            out[k] = v;
          } else {
            out[k] = String(v);
          }
        }
      }
      return out;
    };

    const headers: HttpHeaders = normalizeHeaders(propsValue.headers);

    if (useRestAuth) {
      // Default JSON for REST when not GET and no explicit content-type provided
      if (
        method !== HttpMethod.GET &&
        !Object.keys(headers).some(
          (k) => k.toLowerCase() === 'content-type'
        )
      ) {
        headers['Content-Type'] = 'application/json';
      }
    } else {
      // webservice.php defaults to urlencoded for POST operations
      if (
        method !== HttpMethod.GET &&
        !Object.keys(headers).some(
          (k) => k.toLowerCase() === 'content-type'
        )
      ) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
    }

    const httpRequest: HttpRequest<HttpMessageBody> = {
      url: finalUrl,
      method,
      headers,
    };

    let data: Record<string, unknown> = propsValue.data ?? {};

    const toQueryParams = (obj: Record<string, unknown>): Record<string, string> => {
      const qp: Record<string, string> = {};
      for (const [k, v] of Object.entries(obj ?? {})) {
        if (v === undefined || v === null) continue;
        qp[k] = typeof v === 'string' ? v : JSON.stringify(v);
      }
      return qp;
    };

    if (useRestAuth) {
      httpRequest.authentication = {
        type: AuthenticationType.BASIC,
        username: auth.username,
        password: auth.password,
      };
    } else {
      const vtigerInstance = await instanceLogin(
        auth.instance_url,
        auth.username,
        auth.password
      );
      if (vtigerInstance === null) return;

      data = {
        sessionName: vtigerInstance.sessionId ?? vtigerInstance.sessionName,
        ...(propsValue.data ?? {}),
      };
    }

    if (method === HttpMethod.GET) {
      httpRequest['queryParams'] = toQueryParams(data);
    } else {
      // For REST with JSON default, send raw object; else url-encode
      const contentType = Object.entries(headers).find(([k]) => k.toLowerCase() === 'content-type')?.[1];
      const ct = Array.isArray(contentType) ? contentType[0] : contentType;
      if (useRestAuth && ct === 'application/json') {
        httpRequest['body'] = data;
      } else {
        httpRequest['body'] = toQueryParams(data);
      }
    }

    const response = await httpClient.sendRequest<Record<string, unknown>[]>(
      httpRequest
    );

    if ([200, 201].includes(response.status)) {
      return response.body;
    }

    return {
      error: 'Unexpected outcome!',
    };
  },
});
