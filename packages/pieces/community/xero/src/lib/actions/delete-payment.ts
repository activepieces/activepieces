import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';
import { XERO_URLS, xeroApi, xeroInput } from '../common/client';
import { xeroOutputSchemas } from '../output-schemas';

export const xeroDeletePayment = createAction({
  auth: xeroAuth,
  name: 'xero_delete_payment',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Payment',
  description: 'Deletes (reverses) a payment so the invoice or bill is unpaid again.',
  audience: 'both',
  aiMetadata: {
    description:
      'Deletes a payment by PaymentID by setting its status to DELETED, which puts the amount back on the invoice or bill; Xero refuses reconciled payments and batch payments. Use Search Payments to find the PaymentID. Idempotent: deleting an already deleted payment leaves it deleted.',
    idempotent: true,
  },
  outputSchema: xeroOutputSchemas.payment,
  props: {
    tenant_id: props.tenant_id,
    payment_id: Property.ShortText({ displayName: 'Payment ID', description: 'The Xero PaymentID (a GUID) to delete.', required: true }),
  },
  async run(context) {
    return deletePayment({
      accessToken: context.auth.access_token,
      tenantId: context.propsValue.tenant_id,
      paymentId: xeroInput.requiredText({ value: context.propsValue.payment_id, field: 'Payment ID' }),
    });
  },
});

async function deletePayment({ accessToken, tenantId, paymentId }: { accessToken: string; tenantId: string; paymentId: string }) {
  const url = `${XERO_URLS.api}/Payments/${encodeURIComponent(paymentId)}`;
  const current = xeroApi.firstRecord({
    body: await xeroApi.request<unknown>({ accessToken, tenantId, method: HttpMethod.GET, url, operation: 'get payment before deleting' }),
    key: 'Payments',
    operation: 'get payment before deleting',
  });
  if (current['Status'] === 'DELETED') return current;
  const body = await xeroApi.request<unknown>({
    accessToken,
    tenantId,
    method: HttpMethod.POST,
    url,
    body: { Payments: [{ Status: 'DELETED' }] },
    operation: 'delete payment',
  });
  return xeroApi.firstRecord({ body, key: 'Payments', operation: 'delete payment' });
}
