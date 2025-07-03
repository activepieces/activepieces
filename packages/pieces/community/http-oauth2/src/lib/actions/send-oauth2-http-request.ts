import {
  AuthenticationType,
  httpClient,
  HttpError,
  HttpHeaders,
  HttpMessageBody,
  HttpMethod,
  HttpRequest,
  HttpResponse,
  QueryParams,
} from '@activepieces/pieces-common';
import { httpOauth2Auth } from '../..';
import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/shared';
import FormData from 'form-data';
import { HttpsProxyAgent } from 'https-proxy-agent';
import axios from 'axios';

export const httpOauth2RequestAction = createAction({
  auth: httpOauth2Auth,
  name: 'send-oauth2-request',
  displayName: 'Send an OAuth2 Request',
  description:
    'Sends HTTP request to a specified URL that requires OAuth 2.0 authorization and returns the response.',
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      required: true,
    }),
    method: Property.StaticDropdown({
      displayName: 'Method',
      required: true,
      options: {
        options: [
          { value: HttpMethod.GET, label: 'GET' },
          { value: HttpMethod.POST, label: 'POST' },
          { value: HttpMethod.PUT, label: 'PUT' },
          { value: HttpMethod.PATCH, label: 'PATCH' },
          { value: HttpMethod.DELETE, label: 'DELETE' },
        ],
      },
    }),
    headers: Property.Object({
      displayName: 'Headers',
      required: false,
    }),
    queryParams: Property.Object({
      displayName: 'Query Parameters',
      required: false,
    }),
    body_type: Property.StaticDropdown({
      displayName: 'Body Type',
      required: false,
      defaultValue: 'none',
      options: {
        disabled: false,
        options: [
          {
            label: 'None',
            value: 'none',
          },
          {
            label: 'Form Data',
            value: 'form_data',
          },
          {
            label: 'JSON',
            value: 'json',
          },
          {
            label: 'Raw',
            value: 'raw',
          },
        ],
      },
    }),
    body: Property.DynamicProperties({
      displayName: 'Body',
      refreshers: ['body_type'],
      required: false,
      props: async ({ body_type }) => {
        if (!body_type) return {};

        const bodyTypeInput = body_type as unknown as string;

        const fields: DynamicPropsValue = {};

        switch (bodyTypeInput) {
          case 'none':
            break;
          case 'json':
            fields['data'] = Property.Json({
              displayName: 'JSON Body',
              required: true,
            });
            break;
          case 'raw':
            fields['data'] = Property.LongText({
              displayName: 'Raw Body',
              required: true,
            });
            break;
          case 'form_data':
            fields['data'] = Property.Object({
              displayName: 'Form Data',
              required: true,
            });
            break;
        }
        return fields;
      },
    }),
    use_proxy: Property.Checkbox({
      displayName: 'Use Proxy',
      defaultValue: false,
      description: 'Use a proxy for this request',
      required: false,
    }),
    proxy_settings: Property.DynamicProperties({
      displayName: 'Proxy Settings',
      refreshers: ['use_proxy'],
      required: false,
      props: async ({ use_proxy }) => {
        if (!use_proxy) return {};

        const fields: DynamicPropsValue = {};

        fields['proxy_host'] = Property.ShortText({
          displayName: 'Proxy Host',
          required: true,
        });

        fields['proxy_port'] = Property.Number({
          displayName: 'Proxy Port',
          required: true,
        });

        fields['proxy_username'] = Property.ShortText({
          displayName: 'Proxy Username',
          required: false,
        });

        fields['proxy_password'] = Property.ShortText({
          displayName: 'Proxy Password',
          required: false,
        });

        return fields;
      },
    }),
    failsafe: Property.Checkbox({
      displayName: 'No Error on Failure',
      required: false,
    }),
    timeout: Property.Number({
      displayName: 'Timeout (in seconds)',
      required: false,
    }),
  },
  errorHandlingOptions: {
    continueOnFailure: { hide: true },
    retryOnFailure: { defaultValue: true },
  },
  async run(context) {
    const {
      method,
      url,
      headers,
      queryParams,
      body,
      body_type,
      timeout,
      failsafe,
      use_proxy,
    } = context.propsValue;
    const { auth } = context;

    assertNotNullOrUndefined(method, 'Method');
    assertNotNullOrUndefined(url, 'URL');

    const request: HttpRequest = {
      method,
      url,
      headers: headers as HttpHeaders,
      queryParams: queryParams as QueryParams,
      timeout: timeout ? timeout * 1000 : 0,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
    };

    if (body) {
      const bodyInput = body['data'];
      if (body_type === 'form_data') {
        const formData = new FormData();
        for (const key in bodyInput) {
          formData.append(key, bodyInput[key]);
        }
        request.body = formData;
        request.headers = { ...request.headers, ...formData.getHeaders() };
      } else {
        request.body = bodyInput;
      }
    }

    try {
      if (use_proxy) {
        const proxySettings = context.propsValue.proxy_settings;
        assertNotNullOrUndefined(proxySettings, 'Proxy Settings');
        assertNotNullOrUndefined(proxySettings['proxy_host'], 'Proxy Host');
        assertNotNullOrUndefined(proxySettings['proxy_port'], 'Proxy Port');
        let proxyUrl;

        if (
          proxySettings['proxy_username'] &&
          proxySettings['proxy_password']
        ) {
          proxyUrl = `http://${proxySettings['proxy_username']}:${proxySettings['proxy_password']}@${proxySettings['proxy_host']}:${proxySettings['proxy_port']}`;
        } else {
          proxyUrl = `http://${proxySettings['proxy_host']}:${proxySettings['proxy_port']}`;
        }

        const httpsAgent = new HttpsProxyAgent(proxyUrl);
        const axiosClient = axios.create({
          httpsAgent,
        });

        const proxied_response = await axiosClient.request(request);
        return handleResponse(proxied_response.data);
      }
      const response = await httpClient.sendRequest(request);
      return handleResponse(response);
    } catch (error) {
      if (failsafe) {
        return (error as HttpError).errorMessage();
      }

      throw error;
    }
  },
});

const handleResponse = (response: HttpResponse<HttpMessageBody>) => {
  if (
    response.headers &&
    response.headers['content-type'] === 'application/octet-stream'
  ) {
    return {
      ...response,
      bodyBase64: Buffer.from(response.body, 'binary').toString('base64'),
    };
  }
  return response;
};
