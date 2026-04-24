import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, getAuth, safeParseJson } from '../common';

export const customApiCall = createAction({
  auth: ninjapipeAuth,
  name: 'custom_api_call',
  displayName: 'Custom API Call',
  description: 'Performs a raw HTTP request against the NinjaPipe API.',
  props: {
    method: Property.StaticDropdown({
      displayName: 'Method',
      required: true,
      defaultValue: 'GET',
      options: {
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'PATCH', value: 'PATCH' },
          { label: 'DELETE', value: 'DELETE' },
        ],
      },
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'Relative API path starting with / (e.g. /contacts/123).',
      required: true,
    }),
    queryParams: Property.Object({ displayName: 'Query Parameters', required: false }),
    body: Property.Json({ displayName: 'Request Body', required: false }),
  },
  async run(context) {
    const auth = getAuth(context);
    const method = (context.propsValue.method as string) as HttpMethod;
    const path = context.propsValue.path as string;
    const query = context.propsValue.queryParams
      ? Object.fromEntries(
          Object.entries(context.propsValue.queryParams).map(([k, v]) => [k, String(v)])
        )
      : undefined;
    const body = context.propsValue.body
      ? (typeof context.propsValue.body === 'string'
          ? safeParseJson(context.propsValue.body, 'body')
          : context.propsValue.body)
      : undefined;

    if (!path.startsWith('/')) {
      throw new Error('Path must start with /.');
    }

    const response = await ninjapipeApiCall<Record<string, any>>({
      auth,
      method,
      path,
      queryParams: query,
      body: body as unknown,
    });
    return response.body;
  },
});
