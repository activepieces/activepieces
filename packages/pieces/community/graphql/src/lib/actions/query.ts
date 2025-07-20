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
import { httpMethodDropdown } from '../common/props';
import { HttpsProxyAgent } from 'https-proxy-agent';
import axios from 'axios';

export const query = createAction({
  name: 'send_request',
  displayName: 'Send Request',
  description: 'Makes a GraphQL request.',
  props: {
    method: httpMethodDropdown,
    url: Property.ShortText({
      displayName: 'URL',
      required: true,
    }),
    queryParams: Property.Object({
      displayName: 'Query params',
      required: true,
    }),
    headers: Property.Object({
      displayName: 'Headers',
      required: true,
    }),
    query: Property.LongText({
      displayName: 'Query',
      required: true,
    }),
    variables: Property.Json({
      displayName: 'Variables',
      required: false,
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
      query,
      variables,
      timeout,
      failsafe,
      use_proxy,
    } = context.propsValue;

    assertNotNullOrUndefined(method, 'Method');
    assertNotNullOrUndefined(url, 'URL');

    const request: HttpRequest = {
      method,
      url,
      queryParams: queryParams as QueryParams,
      headers: headers as HttpHeaders,
      timeout: timeout ? timeout * 1000 : 0,
      body: JSON.stringify({ query, variables }),
    };

    try {
      if (use_proxy) {
        const proxySettings = context.propsValue.proxy_settings;
        assertNotNullOrUndefined(proxySettings, 'Proxy Settings');
        assertNotNullOrUndefined(proxySettings['proxy_host'], 'Proxy Host');
        assertNotNullOrUndefined(proxySettings['proxy_port'], 'Proxy Port');
        let proxyUrl;

        if (proxySettings['proxy_username'] && proxySettings['proxy_password']) {
          proxyUrl = `http://${proxySettings['proxy_username']}:${proxySettings['proxy_password']}@${proxySettings['proxy_host']}:${proxySettings['proxy_port']}`;
        } else {
          proxyUrl = `http://${proxySettings['proxy_host']}:${proxySettings['proxy_port']}`;
        }
  
        const httpsAgent = new HttpsProxyAgent(proxyUrl)
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
