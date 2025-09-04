import {
    httpClient,
    HttpMethod,
    QueryParams,
} from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { pickBy } from '@activepieces/shared';

const baseRequestProperties = {
  url: Property.ShortText({
    displayName: 'URL',
    description: 'URL of the target page.',
    required: true,
  }),
  headers: Property.Array({
    displayName: 'Custom Headers',
    description: 'Add custom HTTP headers (optional)',
    required: false,
    properties: {
      name: Property.ShortText({
        displayName: 'Header Name',
        description: 'Header name (e.g., User-Agent, Authorization)',
        required: true,
      }),
      value: Property.ShortText({
        displayName: 'Header Value',
        description: 'Header value',
        required: true,
      }),
    },
  }),
  timeout: Property.Number({
    displayName: 'Timeout',
    description: 'Maximum page load time in milliseconds (default: 10000, max: 30000)',
    required: false,
    defaultValue: 10000,
  }),
  js: Property.Checkbox({
    displayName: 'Enable JavaScript',
    description: 'Execute JavaScript for dynamic content (recommended)',
    defaultValue: true,
    required: false,
  }),
  jsTimeout: Property.Number({
    displayName: 'JavaScript Timeout',
    description: 'Maximum JavaScript execution time in milliseconds (default: 2000)',
    required: false,
    defaultValue: 2000,
  }),
  waitFor: Property.ShortText({
    displayName: 'Wait For',
    description: 'CSS selector to wait for dynamic content (e.g., ".content-loaded")',
    required: false,
  }),
  proxy: Property.StaticDropdown({
    displayName: 'Proxy Type',
    description: 'Use residential proxies for sites that block datacenter IPs (more expensive)',
    required: false,
    defaultValue: 'datacenter',
    options: {
      options: [
        { label: '🏢 Datacenter (Fast)', value: 'datacenter' },
        { label: '🏠 Residential (Stealth)', value: 'residential' },
      ],
    },
  }),
  country: Property.StaticDropdown({
    displayName: 'Proxy Country',
    description: 'Geographic location of the proxy server',
    required: false,
    defaultValue: 'us',
    options: {
      options: [
        { label: 'United States', value: 'us' },
        { label: 'Canada', value: 'ca' },
        { label: 'United Kingdom', value: 'gb' },
        { label: 'Germany', value: 'de' },
        { label: 'France', value: 'fr' },
        { label: 'Italy', value: 'it' },
        { label: 'Spain', value: 'es' },
        { label: 'Russia', value: 'ru' },
        { label: 'Japan', value: 'jp' },
        { label: 'South Korea', value: 'kr' },
        { label: 'India', value: 'in' },
      ],
    },
  }),
  customProxy: Property.ShortText({
    displayName: 'Custom Proxy',
    description: 'Your proxy URL in format: http://user:password@host:port',
    required: false,
  }),
  jsScript: Property.LongText({
    displayName: 'JavaScript Code',
    description: 'Custom JavaScript to execute (e.g., document.querySelector("button").click())',
    required: false,
  }),
};

export const webscrapingAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
});

export const webscrapingAiCommon = {
  baseUrl: 'https://api.webscraping.ai',
  endpoints: {
    askQuestion: '/ai/question',
    getPageHtml: '/html',
    getPageText: '/text',
    getStructuredData: '/ai/fields',
    getAccountInfo: '/account',
  },
  askQuestionProperties: {
    question: Property.ShortText({
      displayName: 'Question',
      description:
        'Question or instructions to ask the LLM model about the target page.',
      required: true,
    }),
    ...baseRequestProperties,
    device: Property.StaticDropdown({
      displayName: 'Device Type',
      description: 'Emulate specific device for responsive design testing',
      required: false,
      options: {
        options: [
          { label: 'Desktop', value: 'desktop' },
          { label: 'Mobile', value: 'mobile' },
          { label: 'Tablet', value: 'tablet' },
        ],
      },
    }),
    errorOn404: Property.Checkbox({
      displayName: 'Error on 404',
      description: 'Fail the action if the page returns a 404 error',
      required: false,
    }),
    errorOnRedirect: Property.Checkbox({
      displayName: 'Error on Redirect',
      description: 'Fail the action if the page redirects to another URL',
      required: false,
    }),
    format: Property.StaticDropdown({
      displayName: 'Response Format',
      description: 'Response format: Text (simple) or JSON (structured)',
      required: false,
      defaultValue: 'text',
      options: {
        options: [
          { label: 'Text', value: 'text' },
          { label: 'JSON', value: 'json' },
        ],
      },
    }),
  },
  getPageHtmlProperties: {
    ...baseRequestProperties,
    returnScriptResult: Property.Checkbox({
      displayName: 'Return JavaScript Result',
      description:
        'Return result of the custom JavaScript code (js_script parameter) \
 execution on the target page (false by default, page HTML will be returned).',
      required: false,
    }),
    device: Property.StaticDropdown({
      displayName: 'Device Type',
      description: 'Emulate specific device for responsive design testing',
      required: false,
      options: {
        options: [
          { label: 'Desktop', value: 'desktop' },
          { label: 'Mobile', value: 'mobile' },
          { label: 'Tablet', value: 'tablet' },
        ],
      },
    }),
    errorOn404: Property.Checkbox({
      displayName: 'Error on 404',
      description: 'Fail the action if the page returns a 404 error',
      required: false,
    }),
    errorOnRedirect: Property.Checkbox({
      displayName: 'Error on Redirect',
      description: 'Fail the action if the page redirects to another URL',
      required: false,
    }),
    format: Property.StaticDropdown({
      displayName: 'Response Format',
      description: 'Response format: Text (simple) or JSON (structured)',
      required: false,
      defaultValue: 'text',
      options: {
        options: [
          { label: 'Text', value: 'text' },
          { label: 'JSON', value: 'json' },
        ],
      },
    }),
  },
  getPageTextProperties: {
    ...baseRequestProperties,
    textFormat: Property.StaticDropdown({
      displayName: 'Text Format',
      description: 'Response format: Plain text, JSON (with title/description/content), or XML',
      required: false,
      defaultValue: 'plain',
      options: {
        options: [
          { label: 'Plain Text', value: 'plain' },
          { label: 'JSON', value: 'json' },
          { label: 'XML', value: 'xml' },
        ],
      },
    }),
    returnLinks: Property.Checkbox({
      displayName: 'Return Links',
      description: 'Include links in response (only works with JSON format)',
      required: false,
    }),
    device: Property.StaticDropdown({
      displayName: 'Device Type',
      description: 'Emulate specific device for responsive design testing',
      required: false,
      options: {
        options: [
          { label: 'Desktop', value: 'desktop' },
          { label: 'Mobile', value: 'mobile' },
          { label: 'Tablet', value: 'tablet' },
        ],
      },
    }),
    errorOn404: Property.Checkbox({
      displayName: 'Error on 404',
      description: 'Fail the action if the page returns a 404 error',
      required: false,
    }),
    errorOnRedirect: Property.Checkbox({
      displayName: 'Error on Redirect',
      description: 'Fail the action if the page redirects to another URL',
      required: false,
    }),
  },
  getPageStructuredDataProperties: {
    fields: Property.Object({
      displayName: 'Fields to Extract',
      description: 'Define fields to extract (e.g., {"title": "Product title", "price": "Product price"})',
      required: true,
    }),
    ...baseRequestProperties,
    device: Property.StaticDropdown({
      displayName: 'Device Type',
      description: 'Emulate specific device for responsive design testing',
      required: false,
      options: {
        options: [
          { label: 'Desktop', value: 'desktop' },
          { label: 'Mobile', value: 'mobile' },
          { label: 'Tablet', value: 'tablet' },
        ],
      },
    }),
    errorOn404: Property.Checkbox({
      displayName: 'Error on 404',
      description: 'Fail the action if the page returns a 404 error',
      required: false,
    }),
    errorOnRedirect: Property.Checkbox({
      displayName: 'Error on Redirect',
      description: 'Fail the action if the page redirects to another URL',
      required: false,
    }),
  },
  askQuestion: async (params: askQuestionParams) => {
    const rawParams: Record<string, string | number | boolean | undefined> = {
      api_key: params.apiKey,
      url: params.url,
      question: params.question,
      timeout: params.timeout,
      js: params.js,
      js_timeout: params.jsTimeout,
      wait_for: params.waitFor,
      proxy: params.proxy,
      country: params.country,
      custom_proxy: params.customProxy,
      device: params.device,
      error_on_404: params.errorOn404,
      error_on_redirect: params.errorOnRedirect,
      js_script: params.jsScript,
      format: params.format,
      headers: params.headers && Array.isArray(params.headers)
        ? JSON.stringify(Object.fromEntries(params.headers.map(h => [h.name, h.value])))
        : undefined,
    };

    const filtered = pickBy(
      rawParams,
      (value) => value !== undefined
    ) as Record<string, string | number | boolean>;
    const queryParams: QueryParams = Object.fromEntries(
      Object.entries(filtered).map(([k, v]) => [k, String(v)])
    ) as QueryParams;
    return await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${webscrapingAiCommon.baseUrl}${webscrapingAiCommon.endpoints.askQuestion}`,
      queryParams,
    });
  },
  getPageHtml: async (params: getPageHtmlParams) => {
    const rawParams: Record<string, string | number | boolean | undefined> = {
      api_key: params.apiKey,
      url: params.url,
      headers: params.headers && Array.isArray(params.headers)
        ? JSON.stringify(Object.fromEntries(params.headers.map(h => [h.name, h.value])))
        : undefined,
      timeout: params.timeout,
      js: params.js,
      js_timeout: params.jsTimeout,
      wait_for: params.waitFor,
      proxy: params.proxy,
      country: params.country,
      custom_proxy: params.customProxy,
      device: params.device,
      error_on_404: params.errorOn404,
      error_on_redirect: params.errorOnRedirect,
      js_script: params.jsScript,
      return_script_result: params.returnScriptResult,
      format: params.format,
    };
    const filtered = pickBy(
      rawParams,
      (value) => value !== undefined
    ) as Record<string, string | number | boolean>;
    const queryParams: QueryParams = Object.fromEntries(
      Object.entries(filtered).map(([k, v]) => [k, String(v)])
    ) as QueryParams;
    return await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${webscrapingAiCommon.baseUrl}${webscrapingAiCommon.endpoints.getPageHtml}`,
      queryParams,
    });
  },
  getPageText: async (params: getPageTextParams) => {
    const rawParams: Record<string, string | number | boolean | undefined> = {
      api_key: params.apiKey,
      text_format: params.textFormat,
      return_links: params.returnLinks,
      url: params.url,
      headers: params.headers && Array.isArray(params.headers)
        ? JSON.stringify(Object.fromEntries(params.headers.map(h => [h.name, h.value])))
        : undefined,
      timeout: params.timeout,
      js: params.js,
      js_timeout: params.jsTimeout,
      wait_for: params.waitFor,
      proxy: params.proxy,
      country: params.country,
      custom_proxy: params.customProxy,
      device: params.device,
      error_on_404: params.errorOn404,
      error_on_redirect: params.errorOnRedirect,
      js_script: params.jsScript,
    };
    const filtered = pickBy(
      rawParams,
      (value) => value !== undefined
    ) as Record<string, string | number | boolean>;
    const queryParams: QueryParams = Object.fromEntries(
      Object.entries(filtered).map(([k, v]) => [k, String(v)])
    ) as QueryParams;
    return await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${webscrapingAiCommon.baseUrl}${webscrapingAiCommon.endpoints.getPageText}`,
      queryParams,
    });
  },
  getPageStructuredData: async (params: getPageStructuredDataParams) => {
    const rawParams: Record<string, string | number | boolean | undefined> = {
      api_key: params.apiKey,
      url: params.url,
      headers: params.headers && Array.isArray(params.headers)
        ? JSON.stringify(Object.fromEntries(params.headers.map(h => [h.name, h.value])))
        : undefined,
      timeout: params.timeout,
      js: params.js,
      js_timeout: params.jsTimeout,
      wait_for: params.waitFor,
      proxy: params.proxy,
      country: params.country,
      custom_proxy: params.customProxy,
      device: params.device,
      error_on_404: params.errorOn404,
      error_on_redirect: params.errorOnRedirect,
      js_script: params.jsScript,
    };

    const filtered = pickBy(
      rawParams,
      (value) => value !== undefined
    ) as Record<string, string | number | boolean>;

    const expandedFields: Record<string, string> = Object.fromEntries(
      Object.entries(params.fields || {}).map(([key, value]) => [
        `fields[${key}]`,
        value,
      ])
    );

    const queryParams: QueryParams = {
      ...Object.fromEntries(
        Object.entries(filtered).map(([k, v]) => [k, String(v)])
      ),
      ...expandedFields,
    } as QueryParams;
    return await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${webscrapingAiCommon.baseUrl}${webscrapingAiCommon.endpoints.getStructuredData}`,
      queryParams,
    });
  },
  getAccountInformation: async ({ apiKey }: AuthenticationRequired) => {
    return await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${webscrapingAiCommon.baseUrl}${webscrapingAiCommon.endpoints.getAccountInfo}`,
      queryParams: { api_key: apiKey },
    });
  },
};


type AuthenticationRequired = {
  apiKey: string;
};

interface baseRequestParams extends AuthenticationRequired {
  url: string;
  headers?: Array<{name: string, value: string}>;
  timeout?: number;
  js?: boolean;
  jsTimeout?: number;
  waitFor?: string;
  proxy?: 'datacenter' | 'residential';
  country?:
    | 'us'
    | 'gb'
    | 'de'
    | 'it'
    | 'fr'
    | 'ca'
    | 'es'
    | 'ru'
    | 'jp'
    | 'kr'
    | 'in';
  customProxy?: string;
  jsScript?: string;
}

interface askQuestionParams extends baseRequestParams {
  question: string;
  device?: 'desktop' | 'mobile' | 'tablet';
  errorOn404?: boolean;
  errorOnRedirect?: boolean;
  format?: 'json' | 'text';
}

interface getPageHtmlParams extends baseRequestParams {
  returnScriptResult?: boolean;
  device?: 'desktop' | 'mobile' | 'tablet';
  errorOn404?: boolean;
  errorOnRedirect?: boolean;
  format?: 'json' | 'text';
}

interface getPageTextParams extends baseRequestParams {
  textFormat?: 'plain' | 'xml' | 'json';
  returnLinks?: boolean;
  device?: 'desktop' | 'mobile' | 'tablet';
  errorOn404?: boolean;
  errorOnRedirect?: boolean;
}

interface getPageStructuredDataParams extends baseRequestParams {
  fields: Record<string, string>;
  device?: 'desktop' | 'mobile' | 'tablet';
  errorOn404?: boolean;
  errorOnRedirect?: boolean;
}
