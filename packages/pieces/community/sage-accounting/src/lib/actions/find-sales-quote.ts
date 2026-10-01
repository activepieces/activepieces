import { createAction, Property, dateRangeUtils } from '@activepieces/pieces-framework';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient } from '../client';
import { sageAccountingDropdowns } from '../common/dropdowns';
import { findSalesQuoteActionOutputSchema } from '../output-schemas';

export const findSalesQuoteAction = createAction({
  auth: sageAccountingAuth,
  name: 'find_sales_quote',
  classification: 'SEARCH',
  displayName: 'Find Sales Quote',
  description: 'Searches for sales quotes in Sage Accounting by customer, quote number, status, or date range.',
  audience: 'both',
  aiMetadata: {
    description:
      'Search Sage Accounting sales quotes by customer, quote number (partial match), status, or quote date range. Returns zero or more matches. Read-only, safe to retry.',
    idempotent: true,
  },
  outputSchema: findSalesQuoteActionOutputSchema,
  props: {
    customer: sageAccountingDropdowns.customerFilter,
    search: Property.ShortText({
      displayName: 'Quote Number contains',
      required: false,
    }),
    status: sageAccountingDropdowns.artefactStatusId,
    dateRange: Property.DateRange({
      displayName: 'Quote Date',
      description: 'Only return quotes dated within this range.',
      required: false,
    }),
    updatedOrCreatedSince: Property.DateTime({
      displayName: 'Updated or Created Since',
      description: 'Only return quotes changed since this date/time.',
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
    const { customer, search, status, dateRange, updatedOrCreatedSince, maxResults } = context.propsValue;
    const { after, before } = dateRange ? dateRangeUtils.resolve(dateRange) : { after: undefined, before: undefined };

    const { items } = await sageAccountingClient.list<Record<string, unknown>>({
      accessToken: context.auth.access_token,
      path: sageAccountingClient.paths.salesQuotes,
      query: {
        ...(customer ? { contact_id: customer } : {}),
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
