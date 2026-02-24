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
    headers: Property.Json({
      displayName: 'Headers',
      description: 'Request headers as a JSON object. Defaults include Accept and X-Include for JSON:API.',
      required: false,
      defaultValue: {
        'Accept': 'application/vnd.api+json',
        'X-Include': 'noHateoas;totalCount',
      },
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
    const { method, resourceUri, headers, queryParams, body } = context.propsValue;

    // Build headers — strip empty/null values
    const hdrs: Record<string, string> = {};
    for (const [k, v] of Object.entries(
      (headers as Record<string, unknown>) ?? {}
    )) {
      if (v != null && String(v).trim() !== '') {
        hdrs[k] = String(v);
      }
    }

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
      headers: Object.keys(hdrs).length > 0 ? hdrs : undefined,
      queryParams: Object.keys(qp).length > 0 ? qp : undefined,
      body: hasBody ? body : undefined,
    });

    return {
      status: response.status,
      body: response.body,
    };
  },
});
