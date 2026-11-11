import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { CustomerFilters, sallaCustomers } from '../common/customers';
import { sallaUtils } from '../common/helpers';
import { sallaOutputSchemas } from '../common/output-schemas';

export const findCustomersAction = createAction({
  auth: sallaAuth,
  name: 'find_customers',
  classification: 'SEARCH',
  displayName: 'Find Customers',
  description:
    'Searches the store customers by name, mobile or email; with no filters it returns the latest customers. Salla allows 500 customer requests every 10 minutes, and large result sets use more of that budget.',
  audience: 'human',
  aiMetadata: {
    description:
      'Searches Salla customers by keyword (name, mobile or email) and by date, and returns the matching customers. Use it to find customer IDs before Get Customer, Update Customer or Add Customers to Group. Read-only and safe to retry; Max Results caps the list (1 to 1000), and Salla allows only 500 customer requests per 10 minutes.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.customerList,
  propertyGroups: [
    {
      key: 'search',
      display: 'builder',
      label: 'Search',
      icon: 'user',
      props: ['keyword'],
    },
    {
      key: 'dates',
      display: 'builder',
      label: 'Dates',
      icon: 'calendar',
      props: ['date_from', 'date_to'],
    },
    {
      key: 'footer',
      display: 'footer',
      icon: 'sliders',
      props: ['max_results'],
    },
  ],
  props: {
    keyword: Property.ShortText({
      displayName: 'Keyword',
      description: 'Matches the customer name, mobile or email, for example 0501234567 or sara@example.com.',
      placeholder: '0501234567',
      icon: 'text',
      required: false,
    }),
    date_from: Property.DateTime({
      displayName: 'Date From (date_from)',
      description:
        "Sent to Salla as date_from, a day in store time (Asia/Riyadh), for example 2026-11-01. Salla's docs disagree on whether date_from is the start or the end of the window, so check the results on a test before you rely on it.",
      placeholder: '2026-11-01',
      icon: 'calendar',
      required: false,
    }),
    date_to: Property.DateTime({
      displayName: 'Date To (date_to)',
      description:
        "Sent to Salla as date_to, a day in store time (Asia/Riyadh), for example 2026-11-10. Salla's docs disagree on whether date_to is the start or the end of the window, so check the results on a test before you rely on it.",
      placeholder: '2026-11-10',
      icon: 'calendar',
      required: false,
    }),
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'Stop after this many customers, from 1 to 1000. Default 50. Large result sets use more of the 500 customer requests Salla allows every 10 minutes.',
      display: 'stepper',
      min: 1,
      max: 1000,
      step: 1,
      required: false,
      defaultValue: 50,
    }),
  },
  async run({ auth, propsValue }) {
    const filters: CustomerFilters = {
      maxResults: clampMaxResults(propsValue.max_results),
      keyword: propsValue.keyword ?? undefined,
      dateFrom: sallaUtils.wallClockFromDateTimeProp(propsValue.date_from),
      dateTo: sallaUtils.wallClockFromDateTimeProp(propsValue.date_to),
    };
    return sallaCustomers.listCustomers({ auth, filters });
  },
});

function clampMaxResults(value: number | undefined | null): number {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return DEFAULT_MAX_RESULTS;
  }
  return Math.min(Math.max(Math.floor(value), 1), MAX_RESULTS_LIMIT);
}

const DEFAULT_MAX_RESULTS = 50;
const MAX_RESULTS_LIMIT = 1000;
