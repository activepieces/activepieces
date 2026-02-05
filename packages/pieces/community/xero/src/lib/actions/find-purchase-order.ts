import { Property, createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';

export const xeroFindPurchaseOrder = createAction({
  auth: xeroAuth,
  name: 'xero_find_purchase_order',
  displayName: 'Find Purchase Order',
  description: 'Finds a purchase order by given parameters.',
  props: {
    tenant_id: props.tenant_id,
    contact_id: props.contact_dropdown(false),
    search_by: Property.StaticDropdown({
      displayName: 'Search By',
      required: true,
      options: {
        options: [
          { label: 'Purchase Order Number (exact)', value: 'NUMBER' },
          { label: 'Reference (exact)', value: 'REFERENCE' },
          { label: 'Purchase Order ID (GUID)', value: 'ID' },
        ],
      },
      defaultValue: 'NUMBER',
    }),
    value: Property.ShortText({
      displayName: 'Value',
      description: 'Number, Reference or ID depending on Search By.',
      required: true,
    }),
    statuses: Property.StaticMultiSelectDropdown({
      displayName: 'Statuses',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Submitted', value: 'SUBMITTED' },
          { label: 'Authorised', value: 'AUTHORISED' },
          { label: 'Billed', value: 'BILLED' },
          { label: 'Deleted', value: 'DELETED' },
        ],
      },
    }),
    date_from: Property.ShortText({
      displayName: 'Date From (YYYY-MM-DD)',
      required: false,
    }),
    date_to: Property.ShortText({
      displayName: 'Date To (YYYY-MM-DD)',
      required: false,
    }),
    order: Property.ShortText({ displayName: 'Order (e.g., Date DESC)', required: false }),
    page: Property.Number({ displayName: 'Page', required: false }),
    page_size: Property.Number({ displayName: 'Page Size (1-1000)', required: false }),
  },
  async run(context) {
    const {
      tenant_id,
      contact_id,
      search_by,
      value,
      statuses,
      date_from,
      date_to,
      order,
      page,
      page_size,
    } = context.propsValue as any;

    const baseUrl = 'https://api.xero.com/api.xro/2.0/PurchaseOrders';

    // If searching by ID, use record filter path for efficiency
    if (search_by === 'ID') {
      const url = `${baseUrl}/${encodeURIComponent(value)}`;
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: (context.auth as any).access_token,
        },
        headers: { 'Xero-Tenant-Id': tenant_id },
      };
      const result = await httpClient.sendRequest(request);
      if (result.status === 200) return result.body;
      return result;
    }

    const params: string[] = [];
    if (Array.isArray(statuses) && statuses.length === 1) {
      params.push(`status=${encodeURIComponent(statuses[0])}`);
    }
    if (date_from) params.push(`DateFrom=${encodeURIComponent(date_from)}`);
    if (date_to) params.push(`DateTo=${encodeURIComponent(date_to)}`);
    if (order) params.push(`order=${encodeURIComponent(order)}`);
    if (page) params.push(`page=${encodeURIComponent(page)}`);
    if (page_size) params.push(`pageSize=${encodeURIComponent(page_size)}`);

    // Equality filter using where for non-ID searches
    const whereClauses: string[] = [];
    if (search_by === 'NUMBER') {
      whereClauses.push(`PurchaseOrderNumber=="${String(value).replace(/"/g, '\\"')}"`);
    } else if (search_by === 'REFERENCE') {
      whereClauses.push(`Reference=="${String(value).replace(/"/g, '\\"')}"`);
    }
    if (contact_id) {
      whereClauses.push(`Contact.ContactID==guid("${contact_id}")`);
    }
    if (Array.isArray(statuses) && statuses.length > 1) {
      const orStatuses = statuses.map((s: string) => `Status=="${s}"`).join(' OR ');
      whereClauses.push(`(${orStatuses})`);
    }
    if (whereClauses.length > 0) {
      params.push(`where=${encodeURIComponent(whereClauses.join(' AND '))}`);
    }

    const url = params.length ? `${baseUrl}?${params.join('&')}` : baseUrl;

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


