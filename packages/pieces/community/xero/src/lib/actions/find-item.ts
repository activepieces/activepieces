import { Property, createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';

export const xeroFindItem = createAction({
  auth: xeroAuth,
  name: 'xero_find_item',
  displayName: 'Find Item',
  description: 'Finds an item by name or code.',
  props: {
    tenant_id: props.tenant_id,
    search_by: Property.StaticDropdown({
      displayName: 'Search By',
      required: true,
      options: {
        options: [
          { label: 'Code (exact)', value: 'CODE' },
          { label: 'Name (exact)', value: 'NAME' },
        ],
      },
      defaultValue: 'CODE',
    }),
    value: Property.ShortText({
      displayName: 'Value',
      description: 'Item Code or Name (exact match).',
      required: true,
    }),
    order: Property.ShortText({
      displayName: 'Order (optional)',
      description: 'e.g. Name or Name DESC',
      required: false,
    }),
  },
  async run(context) {
    const { tenant_id, search_by, value, order } = context.propsValue as any;

    const baseUrl = 'https://api.xero.com/api.xro/2.0/Items';
    const whereField = search_by === 'CODE' ? 'Code' : 'Name';
    const where = `${whereField}="${String(value).replace(/"/g, '\\"')}"`;

    const params: string[] = [`where=${encodeURIComponent(where)}`];
    if (order) params.push(`order=${encodeURIComponent(order)}`);
    const url = `${baseUrl}?${params.join('&')}`;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: (context.auth as any).access_token,
      },
      headers: {
        'Xero-Tenant-Id': tenant_id,
      },
    };

    const result = await httpClient.sendRequest(request);
    if (result.status === 200) {
      return result.body;
    }
    return result;
  },
});


