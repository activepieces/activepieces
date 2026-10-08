import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';
import { XERO_URLS, xeroApi, xeroInput } from '../common/client';
import { xeroOutputSchemas } from '../output-schemas';

export const xeroSearchInvoices = createAction({
  auth: xeroAuth,
  name: 'xero_search_invoices',
  classification: 'SEARCH',
  displayName: 'Search Invoices',
  description: 'Searches sales invoices and bills by type, status, contact, date range or text, one page at a time.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches sales invoices (ACCREC) and supplier bills (ACCPAY) by type, statuses, contact ID, invoice date range or a free-text term, newest first, and returns one page with a hasMore flag; request the next page to continue. Use Get Invoice when you already have the ID or number. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: xeroOutputSchemas.invoicesPage,
  props: {
    tenant_id: props.tenant_id,
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Leave empty to include both sales invoices and bills.',
      required: false,
      options: {
        options: [
          { label: 'Sales invoice (ACCREC)', value: 'ACCREC' },
          { label: 'Bill (ACCPAY)', value: 'ACCPAY' },
        ],
      },
    }),
    statuses: Property.StaticMultiSelectDropdown({
      displayName: 'Statuses',
      required: false,
      options: {
        options: ['DRAFT', 'SUBMITTED', 'AUTHORISED', 'PAID', 'VOIDED', 'DELETED'].map((status) => ({ label: status, value: status })),
      },
    }),
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'Only invoices for this Xero ContactID. Use Find Contact to get it.',
      required: false,
    }),
    date_from: Property.ShortText({ displayName: 'Invoice Date From (YYYY-MM-DD)', required: false }),
    date_to: Property.ShortText({ displayName: 'Invoice Date To (YYYY-MM-DD)', required: false }),
    search_term: Property.ShortText({
      displayName: 'Search Term',
      description: 'Matches invoice number and reference (case-insensitive, partial).',
      required: false,
    }),
    summary_only: Property.Checkbox({
      displayName: 'Summary Only',
      description: 'Leave on for faster results without line items; use Get Invoice for the full invoice.',
      required: false,
      defaultValue: true,
    }),
    page: Property.Number({ displayName: 'Page', description: 'Page number, starting at 1.', required: false, defaultValue: 1 }),
    page_size: Property.Number({ displayName: 'Page Size', description: 'Invoices per page, 1 to 100.', required: false, defaultValue: 100 }),
  },
  async run(context) {
    const { tenant_id, type, statuses, contact_id, date_from, date_to, search_term, summary_only, page, page_size } = context.propsValue;
    const paging = xeroInput.pageParams({ page, pageSize: page_size, maxPageSize: 100 });
    const from = xeroInput.parseDateInput({ value: date_from, field: 'Invoice Date From' });
    const to = xeroInput.parseDateInput({ value: date_to, field: 'Invoice Date To' });
    const contactId = xeroInput.trimmedOrUndefined({ value: contact_id });
    const term = xeroInput.trimmedOrUndefined({ value: search_term });
    const where = [
      ...(type ? [`Type==${xeroInput.whereString({ value: type })}`] : []),
      ...(from ? [`Date>=${xeroInput.whereDate({ value: from })}`] : []),
      ...(to ? [`Date<=${xeroInput.whereDate({ value: to })}`] : []),
    ];
    const body = await xeroApi.request<unknown>({
      accessToken: context.auth.access_token,
      tenantId: tenant_id,
      method: HttpMethod.GET,
      url: `${XERO_URLS.api}/Invoices`,
      queryParams: {
        page: String(paging.page),
        pageSize: String(paging.pageSize),
        order: 'Date DESC',
        unitdp: '4',
        ...(summary_only === false ? {} : { summaryOnly: 'true' }),
        ...(where.length > 0 ? { where: where.join(' AND ') } : {}),
        ...(statuses && statuses.length > 0 ? { Statuses: statuses.join(',') } : {}),
        ...(contactId ? { ContactIDs: contactId } : {}),
        ...(term ? { searchTerm: term } : {}),
      },
      operation: 'search invoices',
    });
    return xeroApi.pageResult({ body, key: 'Invoices', ...paging });
  },
});
