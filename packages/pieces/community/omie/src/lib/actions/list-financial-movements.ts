import { createAction, Property } from '@activepieces/pieces-framework';
import { omieAuth } from '../auth';
import { omieClient } from '../common/client';
import { omieEndpoints } from '../common/endpoints';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_RANGE_DAYS = 30;

export const listFinancialMovements = createAction({
  auth: omieAuth,
  name: 'list_financial_movements',
  classification: 'SEARCH',
  displayName: 'List Financial Movements',
  description:
    'Lists financial movements (payables, receivables and transfers) in a date range, one page at a time.',
  audience: 'both',
  aiMetadata: {
    description:
      'List Omie financial movements (ListarMovimentos) filtered by a date range on one date field, page by page. Defaults to the last 30 days by creation date; safe to retry.',
    idempotent: true,
  },
  props: {
    date_field: Property.StaticDropdown({
      displayName: 'Filter By',
      description: 'Which date the range applies to.',
      required: true,
      defaultValue: 'Inc',
      options: {
        options: [
          { label: 'Created date', value: 'Inc' },
          { label: 'Updated date', value: 'Alt' },
          { label: 'Due date', value: 'Venc' },
          { label: 'Issue date', value: 'Emis' },
          { label: 'Payment date', value: 'Pagto' },
        ],
      },
    }),
    from_date: Property.DateTime({
      displayName: 'From Date',
      description: 'Start of the range. Defaults to 30 days ago.',
      required: false,
    }),
    to_date: Property.DateTime({
      displayName: 'To Date',
      description: 'End of the range. Defaults to today.',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1.',
      required: false,
      defaultValue: 1,
    }),
    page_size: Property.Number({
      displayName: 'Records per Page',
      description: 'Number of movements per page, e.g. 100.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run({ auth, propsValue }) {
    const now = Date.now();
    const from = propsValue.from_date ?? new Date(now - DEFAULT_RANGE_DAYS * DAY_IN_MS).toISOString();
    const to = propsValue.to_date ?? new Date(now).toISOString();
    const { items } = await omieClient.listPage({
      auth,
      endpoint: omieEndpoints.movements,
      page: propsValue.page ?? 1,
      pageSize: propsValue.page_size ?? 100,
      filters: {
        [`dDt${propsValue.date_field}De`]: omieClient.toOmieDate({ value: from }),
        [`dDt${propsValue.date_field}Ate`]: omieClient.toOmieDate({ value: to }),
      },
    });
    return items;
  },
});
