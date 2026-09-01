import {
  httpClient,
  HttpError,
  HttpHeaders,
  HttpRequest,
  QueryParams,
  AuthenticationType,
  toFailsafeOutput,
} from '@activepieces/pieces-common';
import {
  ApFile,
  createAction,
  DynamicPropsValue,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined, isEmpty } from '@activepieces/pieces-framework';
import FormData from 'form-data';
import { httpMethodDropdown } from '../common/props';
import { ProxyAgent } from 'undici';

enum AuthType {
  NONE = 'NONE',
  BASIC = AuthenticationType.BASIC,
  BEARER_TOKEN = AuthenticationType.BEARER_TOKEN,
}

export const httpSendRequestAction = createAction({
  audience: 'both',
  name: 'send_request',
  classification: 'WRITE',
  displayName: 'Send HTTP request',
  description: 'Call any URL with a chosen method, optional authentication and body.',
  aiMetadata: { description: 'Sends an HTTP request to any URL with a chosen method, optional Basic or Bearer auth, an optional JSON, raw or multipart body, and can retry or continue the flow on 4xx/5xx. Use it as the generic escape hatch for an API with no dedicated piece — prefer that app\'s own piece when one exists, and Parse URL to pull a URL apart without calling it. Requires an absolute URL and a method; not idempotent, since a call\'s effect follows the method and POST/PATCH-style calls mutate remote data.', idempotent: false },
  props: {
    method: httpMethodDropdown,
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The absolute URL to call, including the scheme. Example: https://api.example.com/v1/users',
      required: true,
      placeholder: 'https://api.example.com/v1/users',
    }),
    headers: Property.Object({
      displayName: 'Headers',
      description: 'Headers sent with the request, as key-value pairs. Example: key "Content-Type" with value "application/json".',
      required: false,
    }),
    queryParams: Property.Object({
      displayName: 'Query params',
      description: 'Parameters appended to the URL as a query string. Example: key "page" with value "2".',
      required: false,
    }),
    authType: Property.StaticDropdown<AuthType>({
      displayName: 'Authentication',
      required: false,
      defaultValue: AuthType.NONE,
      display: 'cards',
      options: {
        disabled: false,
        options: [
          {
            label: 'None',
            value: AuthType.NONE,
            description: 'No credentials',
            icon: 'blank',
          },
          {
            label: 'Basic Auth',
            value: AuthType.BASIC,
            description: 'Username and password',
            icon: 'user',
          },
          {
            label: 'Bearer Token',
            value: AuthType.BEARER_TOKEN,
            description: 'Token in the header',
            icon: 'tag',
          },
        ],
      },
    }),
    authFields: Property.DynamicProperties({
      displayName: 'Authentication Fields',
      required: false,
      auth: PieceAuth.None(),
      refreshers: ['authType'],
      props: async ({ authType }): Promise<DynamicPropsValue> => {
        if (authType === AuthType.BASIC) {
          return {
            username: Property.ShortText({
              displayName: 'Username',
              description: 'The username to use for authentication.',
              required: true,
            }),
            password: Property.ShortText({
              displayName: 'Password',
              description: 'The password to use for authentication. Stored in the flow definition and visible in exports, so prefer HTTP (OAuth2) or a dedicated piece for long-lived credentials.',
              required: true,
            }),
          };
        }
        if (authType === AuthType.BEARER_TOKEN) {
          return {
            token: Property.ShortText({
              displayName: 'Token',
              description: 'The Bearer token to use for authentication. Stored in the flow definition and visible in exports, so prefer HTTP (OAuth2) or a dedicated piece for long-lived credentials.',
              required: true,
            }),
          };
        }
        return {};
      },
    }),
    body_type: Property.StaticDropdown({
      displayName: 'Body Type',
      description: 'How to encode the request body. Leave as None for GET requests.',
      required: false,
      defaultValue: 'none',
      display: 'cards',
      options: {
        disabled: false,
        options: [
          {
            label: 'None',
            value: 'none',
            description: 'No body',
            icon: 'blank',
          },
          {
            label: 'JSON',
            value: 'json',
            description: 'Structured payload',
            icon: 'code',
          },
          {
            label: 'Form Data',
            value: 'form_data',
            description: 'Fields and files',
            icon: 'paperclip',
          },
          {
            label: 'Raw',
            value: 'raw',
            description: 'Plain text body',
            icon: 'text',
          },
        ],
      },
    }),
    body: Property.DynamicProperties({
      displayName: 'Body',
      refreshers: ['body_type'],
      required: false,
      auth: PieceAuth.None(),
      props: async ({ body_type }): Promise<DynamicPropsValue> => {
        if (body_type === 'json') {
          return {
            data: Property.Json({
              displayName: 'JSON Body',
              required: true,
            }),
          };
        }
        if (body_type === 'raw') {
          return {
            data: Property.LongText({
              displayName: 'Raw Body',
              required: true,
            }),
          };
        }
        if (body_type === 'form_data') {
          return {
            data: Property.Array({
              displayName: 'Form Data',
              required: true,
              properties: {
                fieldName: Property.ShortText({
                  displayName: 'Field Name',
                  required: true,
                }),
                fieldType: Property.StaticDropdown({
                  displayName: 'Field Type',
                  required: true,
                  options: {
                    disabled: false,
                    options: [
                      { label: 'Text', value: 'text' },
                      { label: 'File', value: 'file' },
                    ],
                  },
                }),
                textFieldValue: Property.LongText({
                  displayName: 'Text Field Value',
                  required: false,
                }),
                fileFieldValue: Property.File({
                  displayName: 'File Field Value',
                  required: false,
                }),
              },
            }),
          };
        }
        return {};
      },
    }),
    response_is_binary: Property.Checkbox({
      displayName: 'Response is Binary',
      description: 'Return the response body as base64. Enable for files like PDFs or images.',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
    use_proxy: Property.Checkbox({
      displayName: 'Use Proxy',
      defaultValue: false,
      description: 'Route this request through an HTTP proxy.',
      required: false,
      advanced: true,
    }),
    proxy_settings: Property.DynamicProperties({
      auth: PieceAuth.None(),
      displayName: 'Proxy Settings',
      refreshers: ['use_proxy'],
      required: false,
      advanced: true,
      props: async ({ use_proxy }): Promise<DynamicPropsValue> => {
        if (!use_proxy) return {};

        return {
          proxy_host: Property.ShortText({
            displayName: 'Proxy Host',
            required: true,
            placeholder: 'proxy.example.com',
          }),
          proxy_port: Property.Number({
            displayName: 'Proxy Port',
            required: true,
          }),
          proxy_username: Property.ShortText({
            displayName: 'Proxy Username',
            required: false,
          }),
          proxy_password: Property.ShortText({
            displayName: 'Proxy Password',
            description: 'Stored in the flow definition and visible in exports.',
            required: false,
          }),
        };
      },
    }),
    timeout: Property.Number({
      displayName: 'Timeout',
      description: 'Seconds to wait before giving up on the request. Leave empty for no timeout.',
      required: false,
      display: 'stepper',
      min: 1,
      max: 300,
      step: 1,
      advanced: true,
    }),
    followRedirects: Property.Checkbox({
      displayName: 'Follow redirects',
      description: 'Follow 3xx redirects to the new location instead of returning the redirect response.',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
    failureMode: Property.StaticDropdown({
      displayName: 'On Failure',
      required: false,
      defaultValue: 'continue_none',
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
      advanced: true,
    })
  },
  propertyGroups: [
    {
      key: 'request',
      display: 'section',
      label: 'Request',
      icon: 'send',
      props: ['method', 'url', 'headers', 'queryParams'],
    },
    {
      key: 'auth',
      display: 'section',
      label: 'Authentication',
      icon: 'user',
      props: ['authType', 'authFields'],
    },
    {
      key: 'body',
      display: 'section',
      label: 'Body',
      icon: 'code',
      props: ['body_type', 'body'],
    },
  ],
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
      followRedirects,
    } = context.propsValue;

    assertNotNullOrUndefined(method, 'Method');
    assertNotNullOrUndefined(url, 'URL');

    const request: HttpRequest = {
      method,
      url,
      headers: headers as HttpHeaders,
      queryParams: queryParams as QueryParams,
      timeout: timeout ? timeout * 1000 : 0,
      followRedirects,
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

    if (response_is_binary) {
      request.responseType = 'arraybuffer';
    }

    const formBodyInput =
      body && body_type === 'form_data' ? ((body['data'] ?? []) as FormDataField[]) : undefined;

    if (body && formBodyInput === undefined) {
      request.body = body['data'];
    }

    const apiRequest = async () => {
      if (formBodyInput !== undefined) {
        const formData = toFormData(formBodyInput);
        request.body = formData;
        request.headers = { ...(headers as HttpHeaders), ...formData.getHeaders() };
      }
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

        return await httpClient.sendRequest(request, {
          dispatcher: new ProxyAgent(proxyUrl),
        });
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
        const status = error instanceof HttpError ? error.response.status : 0;

        switch (failureMode) {
          case 'retry_all': {
            if (attempts < 3) continue;
            throw error;
          }
          case 'retry_5xx': {
            if (status >= 500 && status < 600) {
              if (attempts < 3) continue;
              throw error;
            }
            return toFailsafeOutput({ error, requestBody: request.body });
          }

          case 'continue_all':
            return toFailsafeOutput({ error, requestBody: request.body });
          case 'continue_4xx':
            if (status >= 400 && status < 500) {
              return toFailsafeOutput({ error, requestBody: request.body });
            }
            if (attempts < 3) continue;
            throw error;
          case 'continue_none':
            throw error;
          default:
            throw error;
        }
      }
    }

    throw new Error('Unexpected error occured');
  },
});

const toFormData = (fields: FormDataField[]) => {
  const formData = new FormData();
  for (const { fieldName, fieldType, textFieldValue, fileFieldValue } of fields) {
    if (fieldType === 'text' && !isEmpty(textFieldValue)) {
      formData.append(fieldName, textFieldValue);
    } else if (fieldType === 'file' && !isEmpty(fileFieldValue)) {
      formData.append(fieldName, fileFieldValue!.data, { filename: fileFieldValue?.filename });
    }
  }
  return formData;
};

const handleBinaryResponse = (
  bodyContent: string | ArrayBuffer | Buffer,
  status: number,
  headers?: HttpHeaders,
  isBinary?: boolean
) => {
  let body;

  if (isBinary && isBinaryBody(bodyContent)) {
    body = Buffer.from(bodyContent as unknown as string).toString('base64');
  } else {
    body = bodyContent;
  }

  return { status, headers, body };
};

const isBinaryBody = (body: string | ArrayBuffer | Buffer) => {
  return body instanceof ArrayBuffer || Buffer.isBuffer(body);
};

type FormDataField = {
  fieldName: string;
  fieldType: 'text' | 'file';
  textFieldValue?: string;
  fileFieldValue?: ApFile;
};
