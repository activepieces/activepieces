import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth, simplyprintSession } from '../auth';
import { BASE_URL } from '../common/base-url';

/**
 * Escape-hatch action: let users call any SimplyPrint REST endpoint the piece
 * doesn't wrap directly. The path is relative ("printers/Get", "queue/AddItem");
 * the company segment is auto-prefixed from the connection's bound company.
 *
 * Unlike the wrapped actions we do NOT assert on `status:false` here — users may
 * want the raw body to branch on.
 */
export const customApiCallAction = createAction({
  auth: simplyprintAuth,
  name: 'custom_api_call',
  displayName: 'Custom API Call',
  description:
    'Call any SimplyPrint REST endpoint the piece does not wrap directly. Useful for admin / partner / school-dashboard endpoints and anything else behind OAuth scopes.',
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
      description:
        'Endpoint path relative to the account, e.g. "printers/Get" or "queue/AddItem". Do not include the host or the account ID segment.',
      required: true,
    }),
    queryParams: Property.Object({
      displayName: 'Query params',
      required: false,
    }),
    body: Property.Json({
      displayName: 'JSON body',
      description: 'Only used for POST/PUT/PATCH.',
      required: false,
    }),
    timeoutMs: Property.Number({
      displayName: 'Timeout (ms)',
      description: 'Optional request timeout in milliseconds.',
      required: false,
    }),
    includeResponseHeaders: Property.Checkbox({
      displayName: 'Include response headers',
      description: 'Return `{ body, headers, status }` instead of just the body.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    // Property.StaticDropdown's value type is loose; narrow it back to the
    // HttpMethod key set so the lookup below is well-typed.
    const method = (context.propsValue.method ?? 'GET') as keyof typeof HttpMethod;
    const { headers, companyId } = await simplyprintSession.resolveCall(context.auth);
    const path = context.propsValue.path.replace(/^\//, '');
    // Property.Object / Property.Json yield `unknown`; narrow for httpClient.
    const queryParams = context.propsValue.queryParams as Record<string, string> | undefined;
    const body = context.propsValue.body as Record<string, unknown> | undefined;
    const timeout = context.propsValue.timeoutMs;

    const res = await httpClient.sendRequest<unknown>({
      method: HttpMethod[method],
      url: `${BASE_URL.api}/${companyId}/${path}`,
      headers,
      body,
      queryParams,
      ...(typeof timeout === 'number' && timeout > 0 ? { timeout } : {}),
    });

    if (context.propsValue.includeResponseHeaders) {
      return { status: res.status, headers: res.headers, body: res.body };
    }
    return res.body;
  },
});
