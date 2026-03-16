import { createAction, Property } from '@activepieces/pieces-framework';
import { whaleAlertAuth } from '../../index';
import { makeWhaleAlertRequest, WhaleAlertResponse } from '../common/whale-alert-api';

export const getTransactions = createAction({
  auth: whaleAlertAuth,
  name: 'get_transactions',
  displayName: 'Get Transactions',
  description: 'Get recent large cryptocurrency transactions with optional filters.',
  props: {
    min_value: Property.Number({
      displayName: 'Minimum Value (USD)',
      description: 'Minimum transaction value in USD.',
      required: false,
      defaultValue: 500000,
    }),
    start: Property.Number({
      displayName: 'Start Time (Unix Timestamp)',
      description: 'Start of time range as Unix timestamp. Free tier supports last 3600 seconds.',
      required: false,
    }),
    end: Property.Number({
      displayName: 'End Time (Unix Timestamp)',
      description: 'End of time range as Unix timestamp.',
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Cursor for pagination from previous response.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of transactions to return (max 100).',
      required: false,
      defaultValue: 100,
    }),
    currency: Property.ShortText({
      displayName: 'Currency Symbol',
      description: 'Filter by currency symbol (e.g. btc, eth, usdt).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const params: Record<string, string | number | undefined> = {};
    if (propsValue.min_value !== undefined) params['min_value'] = propsValue.min_value;
    if (propsValue.start !== undefined) params['start'] = propsValue.start;
    if (propsValue.end !== undefined) params['end'] = propsValue.end;
    if (propsValue.cursor) params['cursor'] = propsValue.cursor;
    if (propsValue.limit !== undefined) params['limit'] = Math.min(propsValue.limit ?? 100, 100);
    if (propsValue.currency) params['currency'] = propsValue.currency.toLowerCase();

    // start is required by the API — default to current time minus 3600 seconds
    if (!params['start']) {
      params['start'] = Math.floor(Date.now() / 1000) - 3600;
    }

    return makeWhaleAlertRequest<WhaleAlertResponse>(auth as string, '/transactions', params);
  },
});
