import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';
import { XERO_URLS, xeroApi, xeroInput, xeroValue } from '../common/client';
import { xeroOutputSchemas } from '../output-schemas';

export const xeroVoidInvoice = createAction({
  auth: xeroAuth,
  name: 'xero_void_invoice',
  classification: 'DESTRUCTIVE',
  displayName: 'Void or Delete Invoice',
  description: 'Voids an approved invoice or bill, or deletes it while it is still a draft or awaiting approval.',
  audience: 'both',
  aiMetadata: {
    description:
      'Cancels an invoice or bill by InvoiceID: DRAFT and SUBMITTED invoices are deleted, AUTHORISED invoices are voided. Paid or part-paid invoices are refused; delete their payments first with Delete Payment. Idempotent: an invoice that is already voided or deleted is returned unchanged.',
    idempotent: true,
  },
  outputSchema: xeroOutputSchemas.invoice,
  props: {
    tenant_id: props.tenant_id,
    invoice_id: Property.ShortText({ displayName: 'Invoice ID', description: 'The Xero InvoiceID (a GUID) or invoice number.', required: true }),
  },
  async run(context) {
    return voidInvoice({
      accessToken: context.auth.access_token,
      tenantId: context.propsValue.tenant_id,
      invoiceId: xeroInput.requiredText({ value: context.propsValue.invoice_id, field: 'Invoice ID' }),
    });
  },
});

async function voidInvoice({ accessToken, tenantId, invoiceId }: { accessToken: string; tenantId: string; invoiceId: string }) {
  const url = `${XERO_URLS.api}/Invoices/${encodeURIComponent(invoiceId)}`;
  const current = xeroApi.firstRecord({
    body: await xeroApi.request<unknown>({ accessToken, tenantId, method: HttpMethod.GET, url, queryParams: { unitdp: '4' }, operation: 'get invoice before voiding' }),
    key: 'Invoices',
    operation: 'get invoice before voiding',
  });
  const status = xeroValue.readString(current['Status']);
  const target = targetStatus({ status, amountPaid: current['AmountPaid'], amountCredited: current['AmountCredited'] });
  if (target === null) return current;
  const body = await xeroApi.request<unknown>({
    accessToken,
    tenantId,
    method: HttpMethod.POST,
    url,
    queryParams: { unitdp: '4' },
    body: { Invoices: [{ InvoiceID: current['InvoiceID'], Status: target }] },
    operation: target === 'VOIDED' ? 'void invoice' : 'delete invoice',
  });
  return xeroApi.firstRecord({ body, key: 'Invoices', operation: 'void invoice' });
}

function targetStatus({ status, amountPaid, amountCredited }: { status: string | undefined; amountPaid: unknown; amountCredited: unknown }): 'VOIDED' | 'DELETED' | null {
  if (status === 'VOIDED' || status === 'DELETED') return null;
  if (status === 'DRAFT' || status === 'SUBMITTED') return 'DELETED';
  if (status === 'PAID' || (typeof amountPaid === 'number' && amountPaid > 0) || (typeof amountCredited === 'number' && amountCredited > 0)) {
    throw new Error('This invoice has payments or credit applied. Delete the payments (Delete Payment) or remove the allocations before voiding it.');
  }
  if (status === 'AUTHORISED') return 'VOIDED';
  throw new Error(`Invoices with status ${status ?? 'unknown'} cannot be voided or deleted.`);
}
