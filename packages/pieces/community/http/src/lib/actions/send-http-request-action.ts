import {
  httpClient,
  HttpError,
  HttpHeaders,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/shared';
import FormData from 'form-data';
import { httpMethodDropdown } from '../common/props';
import HttpsProxyAgent from 'https-proxy-agent';
import axios from 'axios';

export const httpSendRequestAction = createAction({
  name: 'send_request',
  displayName: 'Send HTTP request',
  description: 'Send HTTP request',
  props: {
    method: httpMethodDropdown,
    url: Property.ShortText({
      displayName: 'URL',
      required: true,
    }),
    headers: Property.Object({
      displayName: 'Headers',
      required: true,
    }),
    queryParams: Property.Object({
      displayName: 'Query params',
      required: true,
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
    timeout: Property.Number({
      displayName: 'Timeout(in seconds)',
      required: false,
    }),
    failsafe: Property.Checkbox({
      displayName: 'No Error on Failure',
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

    assertNotNullOrUndefined(method, 'Method');
    assertNotNullOrUndefined(url, 'URL');

    const request: HttpRequest = {
      method,
      url,
      headers: headers as HttpHeaders,
      queryParams: queryParams as QueryParams,
      timeout: timeout ? timeout * 1000 : 0,
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
        const httpsAgent = HttpsProxyAgent({
          host: proxySettings['proxy_host'],
          port: proxySettings['proxy_port'],
          auth: proxySettings['proxy_username']
            ? `${proxySettings['proxy_username']}:${proxySettings['proxy_password']}`
            : undefined,
        });

        const axiosClient = axios.create({
          httpsAgent,
        });

        const proxied_response = await axiosClient.request(request);
        return proxied_response.data;
      }
      return await httpClient.sendRequest(request);
    } catch (error) {
      if (failsafe) {
        return (error as HttpError).errorMessage();
      }

      throw error;
    }
  },
});
