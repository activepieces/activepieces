import { createAction, Property, dateRangeUtils } from '@activepieces/pieces-framework';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient } from '../client';
import { sageAccountingDropdowns } from '../common/dropdowns';
import { findPurchaseInvoiceActionOutputSchema } from '../output-schemas';

export const findPurchaseInvoiceAction = createAction({
  auth: sageAccountingAuth,
  name: 'find_purchase_invoice',
  classification: 'SEARCH',
  displayName: 'Find Purchase Invoice',
  description: 'Searches for purchase invoices (bills) in Sage Accounting by vendor, invoice number, status, or date range.',
  audience: 'both',
  aiMetadata: {
    description:
      'Search Sage Accounting purchase invoices by vendor, invoice number (partial match), status, or invoice date range. Returns zero or more matches. Read-only, safe to retry.',
    idempotent: true,
  },
  outputSchema: findPurchaseInvoiceActionOutputSchema,
  props: {
    vendor: sageAccountingDropdowns.vendorFilter,
    search: Property.ShortText({
      displayName: 'Invoice Number contains',
      required: false,
    }),
    status: sageAccountingDropdowns.artefactStatusId,
    dateRange: Property.DateRange({
      displayName: 'Invoice Date',
      description: 'Only return invoices dated within this range.',
      required: false,
    }),
    updatedOrCreatedSince: Property.DateTime({
      displayName: 'Updated or Created Since',
      description: 'Only return invoices changed since this date/time.',
      required: false,
    }),
    maxResults: Property.Number({
      displayName: 'Max results',
      required: false,
      defaultValue: 10,
      display: 'stepper',
      min: 1,
      max: 200,
    }),
  },
  async run(context) {
    const { vendor, search, status, dateRange, updatedOrCreatedSince, maxResults } = context.propsValue;
    const { after, before } = dateRange ? dateRangeUtils.resolve(dateRange) : { after: undefined, before: undefined };

    const { items } = await sageAccountingClient.list<Record<string, unknown>>({
      accessToken: context.auth.access_token,
      path: sageAccountingClient.paths.purchaseInvoices,
      query: {
        ...(vendor ? { contact_id: vendor } : {}),
        ...(search ? { search } : {}),
        ...(status ? { status_id: status } : {}),
        ...(after ? { from_date: sageAccountingClient.toDate(after) } : {}),
        ...(before ? { to_date: sageAccountingClient.toDate(before) } : {}),
        ...(updatedOrCreatedSince ? { updated_or_created_since: updatedOrCreatedSince } : {}),
        nested_attributes: 'all',
        items_per_page: String(maxResults ?? 10),
      },
    });

    return items;
  },
});
