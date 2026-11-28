import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../../auth';
import { sallaCustomers } from '../../common/customers';
import { sallaOutputSchemas } from '../../common/output-schemas';

export const aiListCustomersAction = createAction({
  auth: sallaAuth,
  name: 'ai_list_customers',
  classification: 'SEARCH',
  displayName: 'List Customers',
  description: 'Lists store customers that match the given filters.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Salla customers matching an optional keyword (mobile, email or name) and date bounds, returning each customer with its id, name, mobile, email and groups. Use it to find the customer_id that Get Customer, Update Customer and Add Customers to Group need, or to check a customer exists before Create Customer. Returns at most max_results customers (cap 200) and truncated=true when more exist; Salla allows 500 customer requests per 10 minutes, and large result sets use more of that budget.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.customerList,
  props: {
    keyword: Property.ShortText({
      displayName: 'Keyword',
      description: 'Search over customer mobile, email or name, for example +966501234567, sara@example.com or Sara. Leave empty for all customers.',
      required: false,
    }),
    date_from: Property.ShortText({
      displayName: 'Date From',
      description:
        'Sent as Salla\'s date_from filter, a day in store time (Asia/Riyadh), format YYYY-MM-DD, for example 2026-11-01. Salla\'s docs disagree on whether date_from is the start or the end of the range, so check the dates in the results.',
      required: false,
    }),
    date_to: Property.ShortText({
      displayName: 'Date To',
      description:
        'Sent as Salla\'s date_to filter, a day in store time (Asia/Riyadh), format YYYY-MM-DD, for example 2026-11-30. Salla\'s docs disagree on whether date_to is the start or the end of the range, so check the dates in the results.',
      required: false,
    }),
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of customers to return, from 1 to 200, for example 20. Default 20.',
      required: false,
      defaultValue: 20,
    }),
  },
  async run({ auth, propsValue }) {
    return sallaCustomers.listCustomers({
      auth,
      filters: {
        maxResults: clampMaxResults(propsValue.max_results),
        keyword: propsValue.keyword,
        dateFrom: propsValue.date_from,
        dateTo: propsValue.date_to,
      },
    });
  },
});

function clampMaxResults(value: number | undefined | null): number {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return DEFAULT_MAX_RESULTS;
  }
  return Math.min(Math.max(Math.floor(value), 1), MAX_RESULTS_CAP);
}

const DEFAULT_MAX_RESULTS = 20;
const MAX_RESULTS_CAP = 200;
