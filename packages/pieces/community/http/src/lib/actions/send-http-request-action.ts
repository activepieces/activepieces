import {
  httpClient,
  HttpError,
  HttpHeaders,
  HttpRequest,
  QueryParams,
  AuthenticationType,
} from '@activepieces/pieces-common';
import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/shared';
import FormData from 'form-data';
import { httpMethodDropdown } from '../common/props';
import { HttpsProxyAgent } from 'https-proxy-agent';
import axios from 'axios';

enum AuthType {
  NONE = 'NONE',
  BASIC = AuthenticationType.BASIC,
  BEARER_TOKEN = AuthenticationType.BEARER_TOKEN,
}

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
    authType: Property.StaticDropdown<AuthType>({
      displayName: 'Authentication',
      required: true,
      defaultValue: AuthType.NONE,
      options: {
        disabled: false,
        options: [
          { label: 'None', value: AuthType.NONE },
          { label: 'Basic Auth', value: AuthType.BASIC },
          { label: 'Bearer Token', value: AuthType.BEARER_TOKEN },
        ],
      },
    }),
    authFields: Property.DynamicProperties({
      displayName: 'Authentication Fields',
      required: false,
      refreshers: ['authType'],
      props: async ({ authType }) => {
        if (!authType) {
          return {};
        }
        const authTypeEnum = authType.toString() as AuthType;
        let fields: DynamicPropsValue = {};
        switch (authTypeEnum) {
          case AuthType.NONE:
            fields = {};
            break;
          case AuthType.BASIC:
            fields = {
              username: Property.ShortText({
                displayName: 'Username',
                description: 'The username to use for authentication.',
                required: true,
              }),
              password: Property.ShortText({
                displayName: 'Password',
                description: 'The password to use for authentication.',
                required: true,
              }),
            };
            break;
          case AuthType.BEARER_TOKEN:
            fields = {
              token: Property.ShortText({
                displayName: 'Token',
                description: 'The Bearer token to use for authentication.',
                required: true,
              }),
            };
            break;
          default:
            throw new Error('Invalid authentication type');
        }
        return fields;
      },
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
    response_is_binary: Property.Checkbox({
      displayName: 'Response is Binary',
      description:
        'Enable for files like PDFs, images, etc. A base64 body will be returned.',
      required: false,
      defaultValue: false,
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
    failureMode: Property.StaticDropdown({
      displayName: 'On Failure',
      required: false,
      defaultValue:'continue_none',
      options: {
        disabled: false,
        options: [
          { label: 'Retry on all errors (4xx, 5xx)', value: 'retry_all' },
          { label: 'Retry on internal errors (5xx)', value: 'retry_5xx' },
          { label: 'Do not retry', value: 'retry_none' },
          { label: 'Continue flow on all errors', value: 'continue_all' },
          { label: 'Continue flow on 4xx errors', value: 'continue_4xx' },
          { label: 'Do not continue (stop the flow)', value: 'continue_none' },
        ],
      },
    }),
    stopFlow: Property.Checkbox({
      displayName: 'Stop the flow on Failure ?',
      required: false,
    }),
  },
  errorHandlingOptions: {
    continueOnFailure: { hide: true, defaultValue: false },
    retryOnFailure: { hide: true, defaultValue: false },
  },
  async run(context) {
    const {
      method,
      url,
      headers,
      queryParams,
      body,
      body_type,
      response_is_binary,
      timeout,
      failureMode,
      use_proxy,
      authType,
      authFields,
      stopFlow,
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

    switch (authType) {
      case AuthType.BASIC:
        if (authFields) {
          request.authentication = {
            username: authFields['username'],
            password: authFields['password'],
            type: AuthenticationType.BASIC,
          };
        }
        break;
      case AuthType.BEARER_TOKEN:
        if (authFields) {
          request.authentication = {
            token: authFields['token'],
            type: AuthenticationType.BEARER_TOKEN,
          };
        }
        break;
    }

    // Set response type to arraybuffer if binary response is expected
    if (response_is_binary) {
      request.responseType = 'arraybuffer';
    }

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

    const apiRequest = async () => {
      if (use_proxy) {
        const proxySettings = context.propsValue.proxy_settings;
        assertNotNullOrUndefined(proxySettings, 'Proxy Settings');
        assertNotNullOrUndefined(proxySettings['proxy_host'], 'Proxy Host');
        assertNotNullOrUndefined(proxySettings['proxy_port'], 'Proxy Port');
        let proxyUrl;

        if (proxySettings.proxy_username && proxySettings.proxy_password) {
          proxyUrl = `http://${proxySettings.proxy_username}:${proxySettings.proxy_password}@${proxySettings.proxy_host}:${proxySettings.proxy_port}`;
        } else {
          proxyUrl = `http://${proxySettings.proxy_host}:${proxySettings.proxy_port}`;
        }

        const httpsAgent = new HttpsProxyAgent(proxyUrl);
        const axiosClient = axios.create({
          httpsAgent,
        });

        return await httpClient.sendRequest(request, axiosClient);
      }
      return await httpClient.sendRequest(request);
    };

    let attempts = 0;

    while (attempts < 3) {
      try {
        const response = await apiRequest();
        return handleBinaryResponse(
          response.body,
          response.status,
          response.headers,
          response_is_binary
        );
      } catch (error) {
        attempts++;

        if (stopFlow) {
          context.run.stop({
            response: (error as HttpError).response,
          });
          return (error as HttpError).response;
        }

        switch (failureMode) {
          case 'retry_all': {
            if (attempts < 3) continue;
            throw error;
          }
          case 'retry_5xx': {
            if (
              (error as HttpError).response.status >= 500 &&
              (error as HttpError).response.status < 600
            ) {
              if (attempts < 3) continue;
              throw error; // after 3 tries, throw
            }
            return (error as HttpError).errorMessage(); //throw error; // non 5xxx error
          }

          case 'continue_all':
            return (error as HttpError).errorMessage();
          case 'continue_4xx':
            if (
              (error as HttpError).response?.status >= 400 &&
              (error as HttpError).response?.status < 500
            ) {
              return (error as HttpError).errorMessage();
            }
            if (attempts < 3) continue;
            throw error;
          case 'continue_none':
            context.run.stop({
              response: (error as HttpError).response,
            });
            return (error as HttpError).response;
          default:
            throw error;
        }
      }
    }

    throw new Error('Unexpected error occured');
  },
});

const handleBinaryResponse = (
  bodyContent: string | ArrayBuffer | Buffer,
  status: number,
  headers?: HttpHeaders,
  isBinary?: boolean
) => {
  let body;

  if (isBinary && isBinaryBody(bodyContent)) {
    body = Buffer.from(bodyContent).toString('base64');
  } else {
    body = bodyContent;
  }

  return { status, headers, body };
};

const isBinaryBody = (body: string | ArrayBuffer | Buffer) => {
  return body instanceof ArrayBuffer || Buffer.isBuffer(body);
};
