import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';
import { XERO_URLS, xeroApi, xeroInput } from '../common/client';
import { xeroOutputSchemas } from '../output-schemas';

export const xeroGetInvoice = createAction({
  auth: xeroAuth,
  name: 'xero_get_invoice',
  classification: 'READ',
  displayName: 'Get Invoice',
  description: 'Gets one invoice or bill by its ID or invoice number, including line items.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a single sales invoice or supplier bill by its Xero InvoiceID or its invoice number, with line items, totals, amounts due and paid. Use it when you already know which invoice you need; use Search Invoices to find invoices by contact, status or date. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: xeroOutputSchemas.invoice,
  props: {
    tenant_id: props.tenant_id,
    invoice_id: Property.ShortText({
      displayName: 'Invoice ID or Number',
      description: 'The Xero InvoiceID (a GUID) or the invoice number, for example INV-0042.',
      required: true,
    }),
  },
  async run(context) {
    const invoiceId = xeroInput.pathSegment({ value: context.propsValue.invoice_id, field: 'Invoice ID or Number' });
    const body = await xeroApi.request<unknown>({
      accessToken: context.auth.access_token,
      tenantId: context.propsValue.tenant_id,
      method: HttpMethod.GET,
      url: `${XERO_URLS.api}/Invoices/${invoiceId}`,
      queryParams: { unitdp: '4' },
      operation: 'get invoice',
    });
    return xeroApi.firstRecord({ body, key: 'Invoices', operation: 'get invoice' });
  },
});
