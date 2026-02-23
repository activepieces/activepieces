import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oroAuth, oroApiCall } from '../common';

export const apiCallAction = createAction({
  auth: oroAuth,
  name: 'api_call',
  displayName: 'API Call',
  description: 'Make a direct authenticated call to the OroCommerce JSON:API.',
  props: {
    method: Property.StaticDropdown({
      displayName: 'Method',
      required: true,
      defaultValue: 'GET',
      options: {
        options: [
          { label: 'GET',    value: 'GET'    },
          { label: 'POST',   value: 'POST'   },
          { label: 'PATCH',  value: 'PATCH'  },
          { label: 'DELETE', value: 'DELETE' },
        ],
      },
    }),
    resourceUri: Property.ShortText({
      displayName: 'Resource URI',
      description:
        'Path relative to the API base, e.g. /orders, /orders/42, /invoices?filter[status]=open',
      required: true,
    }),
    queryParams: Property.Json({
      displayName: 'Query Parameters',
      description: 'Additional query parameters as a JSON object, e.g. {"filter[status]":"open","page[size]":"20"}',
      required: false,
      defaultValue: {},
    }),
    body: Property.Json({
      displayName: 'Request Body',
      description: 'Request body as a JSON object (used for POST / PATCH).',
      required: false,
      defaultValue: {},
    }),
  },

  async run(context) {
    const { method, resourceUri, queryParams, body } = context.propsValue;

    // Build query params — strip empty/null values
    const qp: Record<string, string> = {};
    for (const [k, v] of Object.entries(
      (queryParams as Record<string, unknown>) ?? {}
    )) {
      if (v != null && String(v).trim() !== '') {
        qp[k] = String(v);
      }
    }

    const hasBody =
      body != null &&
      typeof body === 'object' &&
      Object.keys(body as object).length > 0;

    const response = await oroApiCall({
      method: method as HttpMethod,
      resourceUri,
      auth: context.auth,
      queryParams: Object.keys(qp).length > 0 ? qp : undefined,
      body: hasBody ? body : undefined,
    });

    return {
      status: response.status,
      body: response.body,
    };
  },
});

