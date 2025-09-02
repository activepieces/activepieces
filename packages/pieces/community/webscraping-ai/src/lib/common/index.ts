import {
    httpClient,
    HttpMethod,
    QueryParams,
} from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { pickBy } from '@activepieces/shared';

// Properties
const baseRequestProperties = {
  url: Property.ShortText({
    displayName: 'URL',
    description: 'URL of the target page.',
    required: true,
  }),
  headers: Property.Json({
    displayName: 'Headers',
    description: 'HTTP headers to pass to the target page.',
    required: false,
  }),
  timeout: Property.Number({
    displayName: 'Timeout',
    description:
      'Maximum web page retrieval time in ms. Increase it in case of timeout errors \
 (10000 by default, maximum is 30000).',
    required: false,
  }),
  js: Property.Checkbox({
    displayName: 'Enable JavaScript',
    description:
      'Execute on-page JavaScript using a headless browser (true by default).',
    defaultValue: true,
    required: false,
  }),
  jsTimeout: Property.Number({
    displayName: 'JavaScript Timeout',
    description:
      'Maximum JavaScript rendering time in ms. Increase it in case if you \
 see a loading indicator instead of data on the target page.',
    required: false,
  }),
  waitFor: Property.ShortText({
    displayName: 'Wait For',
    description:
      'CSS selector to wait for before returning the page content. \
 Useful for pages with dynamic content loading. Overrides js_timeout.',
    required: false,
  }),
  proxy: Property.StaticDropdown({
    displayName: 'Proxy',
    description:
      'Type of proxy, use residential proxies if your site restricts \
 traffic from datacenters (datacenter by default). Note that residential proxy \
 requests are more expensive than datacenter, see the pricing page for details.',
    required: false,
    defaultValue: 'datacenter',
    options: {
      options: [
        { label: 'Datacenter', value: 'datacenter' },
        { label: 'Residential', value: 'residential' },
      ],
    },
  }),
  country: Property.StaticDropdown({
    displayName: 'Country',
    description: 'Country of the proxy to use (US by default).',
    required: false,
    defaultValue: 'us',
    options: {
      options: [
        { label: 'United States', value: 'us' },
        { label: 'United Kingdom', value: 'gb' },
        { label: 'Germany', value: 'de' },
        { label: 'Italy', value: 'it' },
        { label: 'France', value: 'fr' },
        { label: 'Canada', value: 'ca' },
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
    description:
      'Your own proxy URL to use instead of our built-in proxy pool \
 in "http://user:password@host:port" format (Smartproxy for example).',
    required: false,
  }),
  jsScript: Property.LongText({
    displayName: 'JavaScript Code',
    description:
      "Custom JavaScript code to execute on the target page. \
 Example: `js_script=document.querySelector('button').click();`",
    required: false,
  }),
};

// Auth
export const webscrapingAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
});

// Common
export const webscrapingAiCommon = {
  baseUrl: 'https://api.webscraping.ai',
  endpoints: {
    askQuestion: '/ai/question',
    getPageHtml: '/html',
    getPageText: '/text',
    getStructuredData: '/ai/fields',
    getAccountInfo: '/account',
  },
  // Properties
  askQuestionProperties: {
    question: Property.ShortText({
      displayName: 'Question',
      description:
        'Question or instructions to ask the LLM model about the target page.',
      required: false,
    }),
    ...baseRequestProperties,
    device: Property.StaticDropdown({
      displayName: 'Device',
      description: 'Type of device emulation.',
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
      description:
        'Return error on 404 HTTP status on the target page (false by default).',
      required: false,
    }),
    errorOnRedirect: Property.Checkbox({
      displayName: 'Error on Redirect',
      description:
        'Return error on redirect on the target page (false by default).',
      required: false,
    }),
    format: Property.StaticDropdown({
      displayName: 'Response Format',
      description:
        'Format of the response (text by default). \
 "json" will return a JSON object with the response, "text" will return a \
 plain text/HTML response.',
      required: false,
      options: {
        options: [
          { label: 'JSON', value: 'json' },
          { label: 'Text', value: 'text' },
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
    format: Property.StaticDropdown({
      displayName: 'Response Format',
      description:
        'Format of the response (text by default). \
 "json" will return a JSON object with the response, "text" will return a \
 plain text/HTML response.',
      required: false,
      options: {
        options: [
          { label: 'JSON', value: 'json' },
          { label: 'Text', value: 'text' },
        ],
      },
    }),
  },
  getPageTextProperties: {
    ...baseRequestProperties,
    textFormat: Property.StaticDropdown({
      displayName: 'Text Format',
      description:
        'Format of the text response (plain by default). "plain" will return only \
 the page body text. "json" and "xml" will return a json/xml with "title", \
 "description" and "content" keys.',
      required: false,
      options: {
        options: [
          { label: 'Plain Text', value: 'plain' },
          { label: 'XML', value: 'xml' },
          { label: 'JSON', value: 'json' },
        ],
      },
    }),
    returnLinks: Property.Checkbox({
      displayName: 'Return Links',
      description:
        '[Works only with text_format=json] Return links from the page \
 body text (false by default). Useful for building web crawlers.',
      required: false,
    }),
    device: Property.StaticDropdown({
      displayName: 'Device',
      description: 'Type of device emulation.',
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
      description:
        'Return error on 404 HTTP status on the target page (false by default).',
      required: false,
    }),
    errorOnRedirect: Property.Checkbox({
      displayName: 'Error on Redirect',
      description:
        'Return error on redirect on the target page (false by default).',
      required: false,
    }),
  },
  getPageStructuredDataProperties: {
    fields: Property.Object({
      displayName: 'Fields',
      description:
        'Object describing fields to extract from the page and their descriptions',
      required: true,
    }),
    ...baseRequestProperties,
    device: Property.StaticDropdown({
      displayName: 'Device',
      description: 'Type of device emulation.',
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
      description:
        'Return error on 404 HTTP status on the target page (false by default).',
      required: false,
    }),
    errorOnRedirect: Property.Checkbox({
      displayName: 'Error on Redirect',
      description:
        'Return error on redirect on the target page (false by default).',
      required: false,
    }),
  },
  // Methods
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
      headers: params.headers ? JSON.stringify(params.headers) : undefined,
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
      headers: params.headers ? JSON.stringify(params.headers) : undefined,
      timeout: params.timeout,
      js: params.js,
      js_timeout: params.jsTimeout,
      wait_for: params.waitFor,
      proxy: params.proxy,
      country: params.country,
      custom_proxy: params.customProxy,
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
      headers: params.headers ? JSON.stringify(params.headers) : undefined,
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
    // Serialize base params
    const rawParams: Record<string, string | number | boolean | undefined> = {
      api_key: params.apiKey,
      url: params.url,
      headers: params.headers ? JSON.stringify(params.headers) : undefined,
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

    // Expand fields object into fields[key]=value query params
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

// Types

type AuthenticationRequired = {
  apiKey: string;
};

interface baseRequestParams extends AuthenticationRequired {
  url: string;
  headers?: Record<string, string>;
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
  question?: string;
  device?: 'desktop' | 'mobile' | 'tablet';
  errorOn404?: boolean;
  errorOnRedirect?: boolean;
  format?: 'json' | 'text';
}

interface getPageHtmlParams extends baseRequestParams {
  returnScriptResult?: boolean;
  format?: 'json' | 'text';
}

interface getPageTextParams extends baseRequestParams {
  textFormat?: 'plain' | 'xml' | 'json';
  returnLinks?: boolean;
  url: string;
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
