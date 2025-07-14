import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';

const ALLOWED_METHODS = [
  'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS',
];

function parseMistralError(e: any): string {
  if (e.response?.data?.error) return e.response.data.error;
  if (e.response?.data?.message) return e.response.data.message;
  if (e.message) return e.message;
  return 'Unknown error';
}

function normalizeHeaders(headers: Record<string, unknown> | undefined): Record<string, string | string[]> {
  if (!headers) return {};
  const result: Record<string, string | string[]> = {};
  for (const [k, v] of Object.entries(headers)) {
    if (Array.isArray(v)) {
      result[k] = v.map((x) => String(x));
    } else if (v !== undefined && v !== null) {
      result[k] = String(v);
    }
  }
  return result;
}

export const customApiCall = createAction({
  auth: mistralAuth,
  name: 'custom_api_call',
  displayName: 'Custom API Call',
  description: 'Call any Mistral endpoint with custom method, headers, and body.',
  props: {
    endpoint: Property.ShortText({
      displayName: 'Endpoint',
      description: 'Relative endpoint path, e.g. /v1/models',
      required: true,
    }),
    method: Property.StaticDropdown({
      displayName: 'HTTP Method',
      required: true,
      options: {
        options: ALLOWED_METHODS.map((m) => ({ label: m, value: m })),
      },
    }),
    query: Property.Json({
      displayName: 'Query Params',
      description: 'Key-value pairs for query string',
      required: false,
    }),
    headers: Property.Json({
      displayName: 'Headers',
      description: 'Additional headers (Authorization is set automatically)',
      required: false,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'Request body (JSON string)',
      required: false,
    }),
    timeout: Property.Number({
      displayName: 'Timeout (ms)',
      description: 'Request timeout in milliseconds',
      required: false,
      defaultValue: 30000,
    }),
    retries: Property.Number({
      displayName: 'Retries',
      description: 'Number of times to retry on transient errors',
      required: false,
      defaultValue: 2,
    }),
    responseFormat: Property.StaticDropdown({
      displayName: 'Response Format',
      required: true,
      defaultValue: 'parsed',
      options: {
        options: [
          { label: 'Parsed (JSON)', value: 'parsed' },
          { label: 'Raw (text)', value: 'raw' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { endpoint, method, query, headers, body, timeout, retries, responseFormat } = propsValue;
    if (!endpoint.startsWith('/')) {
      throw new Error('Endpoint must start with /');
    }
    if (!ALLOWED_METHODS.includes(method)) {
      throw new Error('Invalid HTTP method');
    }
    let url = `https://api.mistral.ai${endpoint}`;
    if (query && Object.keys(query).length > 0) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null) params.append(k, String(v));
      }
      url += `?${params.toString()}`;
    }
    let parsedBody: any = undefined;
    if (body) {
      try {
        parsedBody = JSON.parse(body);
      } catch {
        throw new Error('Body must be valid JSON');
      }
    }
    let lastErr;
    for (let attempt = 0; attempt <= (retries ?? 2); ++attempt) {
      try {
        const response = await httpClient.sendRequest({
          method: method as HttpMethod,
          url,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth as string,
          },
          headers: normalizeHeaders(headers),
          body: parsedBody,
          timeout: timeout ?? 30000,
        });
        if (responseFormat === 'raw') {
          return response.body;
        }
        try {
          return typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
        } catch {
          return response.body;
        }
      } catch (e: any) {
        lastErr = e;
        const status = e.response?.status;
        if (status === 429 || (status && status >= 500 && status < 600)) {
          if (attempt < (retries ?? 2)) {
            await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
        }
        throw new Error(parseMistralError(e));
      }
    }
    throw new Error(parseMistralError(lastErr));
  },
}); 