import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';
import { XERO_URLS, xeroApi, xeroInput } from '../common/client';
import { xeroOutputSchemas } from '../output-schemas';

export const xeroSearchPayments = createAction({
  auth: xeroAuth,
  name: 'xero_search_payments',
  classification: 'SEARCH',
  displayName: 'Search Payments',
  description: 'Searches payments by invoice, status, payment type or date range, one page at a time.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches payments recorded against invoices, bills and credit notes, filtered by invoice ID, status, payment type, reference or payment date range, newest first; returns one page with a hasMore flag. Use it to check whether an invoice was paid or to find a PaymentID before Delete Payment. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: xeroOutputSchemas.paymentsPage,
  props: {
    tenant_id: props.tenant_id,
    invoice_id: Property.ShortText({ displayName: 'Invoice ID', description: 'Only payments on this Xero InvoiceID (a GUID).', required: false }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: { options: [{ label: 'AUTHORISED', value: 'AUTHORISED' }, { label: 'DELETED', value: 'DELETED' }] },
    }),
    payment_type: Property.StaticDropdown({
      displayName: 'Payment Type',
      required: false,
      options: {
        options: ['ACCRECPAYMENT', 'ACCPAYPAYMENT', 'ARCREDITPAYMENT', 'APCREDITPAYMENT', 'AROVERPAYMENTPAYMENT', 'APOVERPAYMENTPAYMENT', 'ARPREPAYMENTPAYMENT', 'APPREPAYMENTPAYMENT'].map(
          (type) => ({ label: type, value: type }),
        ),
      },
    }),
    reference: Property.ShortText({ displayName: 'Reference (exact)', required: false }),
    date_from: Property.ShortText({ displayName: 'Payment Date From (YYYY-MM-DD)', required: false }),
    date_to: Property.ShortText({ displayName: 'Payment Date To (YYYY-MM-DD)', required: false }),
    page: Property.Number({ displayName: 'Page', description: 'Page number, starting at 1.', required: false, defaultValue: 1 }),
    page_size: Property.Number({ displayName: 'Page Size', description: 'Payments per page, 1 to 100.', required: false, defaultValue: 100 }),
  },
  async run(context) {
    const { tenant_id, invoice_id, status, payment_type, reference, date_from, date_to, page, page_size } = context.propsValue;
    const paging = xeroInput.pageParams({ page, pageSize: page_size, maxPageSize: 100 });
    const from = xeroInput.parseDateInput({ value: date_from, field: 'Payment Date From' });
    const to = xeroInput.parseDateInput({ value: date_to, field: 'Payment Date To' });
    const invoiceId = xeroInput.trimmedOrUndefined({ value: invoice_id });
    const ref = xeroInput.trimmedOrUndefined({ value: reference });
    const where = [
      ...(invoiceId ? [`Invoice.InvoiceID==${xeroInput.whereGuid({ value: invoiceId, field: 'Invoice ID' })}`] : []),
      ...(status ? [`Status==${xeroInput.whereString({ value: status })}`] : []),
      ...(payment_type ? [`PaymentType==${xeroInput.whereString({ value: payment_type })}`] : []),
      ...(ref ? [`Reference==${xeroInput.whereString({ value: ref })}`] : []),
      ...(from ? [`Date>=${xeroInput.whereDate({ value: from })}`] : []),
      ...(to ? [`Date<=${xeroInput.whereDate({ value: to })}`] : []),
    ];
    const body = await xeroApi.request<unknown>({
      accessToken: context.auth.access_token,
      tenantId: tenant_id,
      method: HttpMethod.GET,
      url: `${XERO_URLS.api}/Payments`,
      queryParams: {
        page: String(paging.page),
        pageSize: String(paging.pageSize),
        order: 'Date DESC',
        ...(where.length > 0 ? { where: where.join(' AND ') } : {}),
      },
      operation: 'search payments',
    });
    return xeroApi.pageResult({ body, key: 'Payments', ...paging });
  },
});
