import { Property, createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';

export const xeroFindInvoice = createAction({
  auth: xeroAuth,
  name: 'xero_find_invoice',
  displayName: 'Find Invoice',
  description: 'Finds an invoice by number or reference.',
  props: {
    tenant_id: props.tenant_id,
    search_by: Property.StaticDropdown({
      displayName: 'Search By',
      required: true,
      options: {
        options: [
          { label: 'Invoice Number (exact)', value: 'INVOICE_NUMBER' },
          { label: 'Reference (exact)', value: 'REFERENCE' },
          { label: 'Search Term (InvoiceNumber/Reference)', value: 'SEARCH_TERM' },
        ],
      },
      defaultValue: 'INVOICE_NUMBER',
    }),
    value: Property.ShortText({
      displayName: 'Value',
      description: 'Invoice Number, Reference, or Search Term.',
      required: true,
    }),
    type_filter: Property.StaticDropdown({
      displayName: 'Type Filter',
      required: false,
      options: {
        options: [
          { label: 'Sales Invoice (ACCREC)', value: 'ACCREC' },
          { label: 'Bill (ACCPAY)', value: 'ACCPAY' },
        ],
      },
    }),
    summary_only: Property.Checkbox({
      displayName: 'Summary Only (faster, lighter)',
      required: false,
      defaultValue: true,
    }),
    page: Property.Number({ displayName: 'Page', required: false }),
  },
  async run(context) {
    const { tenant_id, search_by, value, type_filter, summary_only, page } =
      context.propsValue as any;

    const baseUrl = 'https://api.xero.com/api.xro/2.0/Invoices';

    const params: string[] = [];
    if (summary_only) params.push('summaryOnly=true');
    if (page) params.push(`page=${encodeURIComponent(page)}`);

    // Build where clause
    const whereClauses: string[] = [];
    if (type_filter) {
      whereClauses.push(`Type=="${type_filter}"`);
    }

    if (search_by === 'INVOICE_NUMBER') {
      whereClauses.push(`InvoiceNumber="${value.replace(/"/g, '\\"')}"`);
    } else if (search_by === 'REFERENCE') {
      whereClauses.push(`Reference="${value.replace(/"/g, '\\"')}"`);
    } else if (search_by === 'SEARCH_TERM') {
      params.push(`SearchTerm=${encodeURIComponent(value)}`);
    }

    if (whereClauses.length > 0) {
      const where = whereClauses.join(' AND ');
      params.push(`where=${encodeURIComponent(where)}`);
    }

    const url = params.length ? `${baseUrl}?${params.join('&')}` : baseUrl;

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
    if (result.status === 200) {
      return result.body;
    }
    return result;
  },
});


