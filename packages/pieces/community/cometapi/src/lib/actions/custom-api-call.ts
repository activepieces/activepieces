import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { cometApiAuth } from '../auth';

export const customApiCallAction = createAction({
  auth: cometApiAuth,
  name: 'custom_api_call',
  displayName: 'Custom API Call',
  description: 'Make a custom API call to CometAPI with smart body handling',
  props: {
    method: Property.StaticDropdown<HttpMethod>({
      displayName: 'Method',
      required: true,
      options: {
        options: [
          { label: 'GET', value: HttpMethod.GET },
          { label: 'POST', value: HttpMethod.POST },
        ],
      },
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description: `Popular endpoints:
• GET /models - List available models
• POST /chat/completions - Chat with AI models

You can use full URL or relative path (e.g., /models)`,
      required: true,
      defaultValue: '/models',
    }),
    headers: Property.Object({
      displayName: 'Headers',
      description:
        'Authorization headers are injected automatically from your connection.',
      required: false,
    }),
    queryParams: Property.Object({
      displayName: 'Query Parameters',
      required: false,
    }),
    body: Property.Json({
      displayName: 'Body',
      description:
        'For POST requests to /chat/completions. This will be automatically ignored for GET requests.',
      required: false,
      defaultValue: {
        model: 'gpt-5-mini',
        messages: [
          {
            role: 'user',
            content: 'Hello! How can you help me today?',
          },
        ],
        stream: false,
      },
    }),
    failsafe: Property.Checkbox({
      displayName: 'No Error on Failure',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { method, url, headers, queryParams, body, failsafe } =
      context.propsValue;
    const auth = context.auth;

    if (!method) {
      throw new Error('Method is required');
    }

    // 构建完整 URL
    const baseUrl = 'https://api.cometapi.com/v1';
    const fullUrl =
      url.startsWith('http://') || url.startsWith('https://')
        ? url
        : `${baseUrl}${url.startsWith('/') ? url : '/' + url}`;

    // 构建请求头
    const requestHeaders = {
      Authorization: `Bearer ${auth}`,
      'Content-Type': 'application/json',
      ...headers,
    };

    // 构建请求参数 - GET 请求时忽略 body
    const requestParams: HttpRequest = {
      method,
      url: fullUrl,
      headers: requestHeaders,
    };

    // 只有非 GET 请求才添加 body
    if (method !== HttpMethod.GET && body) {
      requestParams.body = body;
    }

    // 添加查询参数
    if (queryParams) {
      const queryParamsObj: Record<string, string> = {};
      Object.entries(queryParams).forEach(([key, value]) => {
        queryParamsObj[key] = String(value);
      });
      requestParams.queryParams = queryParamsObj;
    }

    try {
      const response = await httpClient.sendRequest(requestParams);
      return {
        status: response.status,
        headers: response.headers,
        body: response.body,
      };
    } catch (error) {
      if (failsafe) {
        return {
          success: false,
          error: error,
        };
      }
      throw error;
    }
  },
});
