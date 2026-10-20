import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { netlifyAuth } from '../common/auth';
import { netlifyClient } from '../common/client';

export const customApiCall = createAction({
  auth: netlifyAuth,
  name: 'custom_api_call',
  classification: 'WRITE',
  displayName: 'Custom API Call',
  description: 'Make a custom request to the Netlify API with this connection.',
  audience: 'human',
  aiMetadata: {
    description:
      'Sends one raw request to the Netlify API (https://api.netlify.com/api/v1) with the connected account. Use only when no dedicated Netlify action covers the endpoint. The effect depends on the method and path, so it is not safe to retry blindly.',
    idempotent: false,
  },
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'Path under https://api.netlify.com/api/v1, e.g. /sites or /sites/{site_id}/deploys. Full URLs must use that base.',
      required: true,
    }),
    method: Property.StaticDropdown({
      displayName: 'Method',
      required: true,
      defaultValue: HttpMethod.GET,
      options: {
        options: [HttpMethod.GET, HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH, HttpMethod.DELETE].map((method) => ({ label: method, value: method })),
      },
    }),
    headers: Property.Object({ displayName: 'Headers', description: 'Extra headers. Authorization always comes from the connection.', required: false }),
    queryParams: Property.Object({ displayName: 'Query Parameters', required: false }),
    body: Property.Json({ displayName: 'Body', description: 'JSON body for POST, PUT and PATCH.', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await netlifyClient.request({
      auth,
      method: propsValue.method,
      path: netlifyClient.apiPath(propsValue.url),
      query: stringRecord(propsValue.queryParams),
      extraHeaders: stringRecord(propsValue.headers),
      body: jsonBody(propsValue.body),
      redactBody: true,
    });
    return { status: response.status, body: response.body };
  },
});

function stringRecord(value: unknown): Record<string, string> {
  if (!netlifyClient.isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== '').map(([key, item]) => [key, String(item)]));
}

function jsonBody(value: unknown): Record<string, unknown> | Record<string, unknown>[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (netlifyClient.isRecord(value)) return value;
  if (Array.isArray(value) && value.every((item) => netlifyClient.isRecord(item))) return value.filter(netlifyClient.isRecord);
  throw new Error('Body must be a JSON object or an array of objects.');
}
