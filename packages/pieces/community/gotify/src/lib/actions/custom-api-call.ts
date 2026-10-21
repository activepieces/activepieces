import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gotifyAuth } from '../auth';
import { gotifyClient } from '../common/client';

export const customApiCall = createAction({
  auth: gotifyAuth,
  name: 'custom_api_call',
  classification: 'WRITE',
  displayName: 'Custom API Call',
  description: 'Make a request to any Gotify API endpoint with the Client Token.',
  audience: 'human',
  props: {
    path: Property.ShortText({
      displayName: 'Path',
      description: 'Endpoint path on your Gotify server, for example /message or /application/1.',
      required: true,
    }),
    method: Property.StaticDropdown({
      displayName: 'Method',
      required: true,
      defaultValue: HttpMethod.GET,
      options: {
        options: [HttpMethod.GET, HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH, HttpMethod.DELETE].map((method) => ({
          label: method,
          value: method,
        })),
      },
    }),
    queryParams: Property.Object({ displayName: 'Query Parameters', required: false }),
    body: Property.Json({ displayName: 'Body', description: 'JSON body (ignored for GET).', required: false }),
  },
  async run({ auth, propsValue }) {
    const path = parsePath(propsValue.path);
    const method = parseMethod(propsValue.method);
    const query = Object.fromEntries(
      Object.entries(propsValue.queryParams ?? {})
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => [key, typeof value === 'number' ? value : String(value)]),
    );
    const hasBody = method !== HttpMethod.GET && propsValue.body !== undefined && propsValue.body !== null;
    const body = await gotifyClient.request({
      auth: auth.props,
      method,
      path,
      query,
      body: hasBody ? propsValue.body : undefined,
      tokenKind: 'client',
    });
    return { body };
  },
});

function parsePath(value: unknown): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text.startsWith('/') || text.startsWith('//')) {
    throw new Error('Path must start with a single "/", for example /message. Full URLs are not allowed.');
  }
  if (/[?#\\]/.test(text)) {
    throw new Error('Path must not contain "?", "#" or "\\". Use Query Parameters for the query string.');
  }
  if (text.split('/').some((part) => part === '..' || part === '.' || /^%2e/i.test(part))) {
    throw new Error('Path must not contain relative segments.');
  }
  return text;
}

function parseMethod(value: unknown): HttpMethod {
  const allowed: string[] = [HttpMethod.GET, HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH, HttpMethod.DELETE];
  const method = Object.values(HttpMethod).find((m) => m === value);
  if (!method || !allowed.includes(method)) {
    throw new Error('Method must be GET, POST, PUT, PATCH or DELETE.');
  }
  return method;
}
