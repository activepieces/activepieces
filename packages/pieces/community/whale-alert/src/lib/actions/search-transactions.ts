import { createAction, Property } from '@activepieces/pieces-framework';
import { whaleAlertAuth } from '../../index';
import { makeWhaleAlertRequest, WhaleAlertResponse } from '../common/whale-alert-api';

export const searchTransactions = createAction({
  auth: whaleAlertAuth,
  name: 'search_transactions',
  displayName: 'Search Transactions (Whale Hunt)',
  description: 'Search for whale transactions by currency symbol and minimum USD value. Ideal for tracking large on-chain movements.',
  props: {
    currency: Property.ShortText({
      displayName: 'Currency Symbol',
      description: 'Currency symbol to track (e.g. btc, eth, usdt, xrp, sol). Required for whale hunt.',
      required: true,
    }),
    min_value: Property.Number({
      displayName: 'Minimum Value (USD)',
      description: 'Minimum transaction value in USD to qualify as a whale transaction.',
      required: false,
      defaultValue: 1000000,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (max 100).',
      required: false,
      defaultValue: 25,
    }),
    start: Property.Number({
      displayName: 'Start Time (Unix Timestamp)',
      description: 'Start of search window as Unix timestamp. Defaults to last 1 hour.',
      required: false,
    }),
    end: Property.Number({
      displayName: 'End Time (Unix Timestamp)',
      description: 'End of search window as Unix timestamp.',
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Pagination cursor from a previous response.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const params: Record<string, string | number | undefined> = {
      currency: propsValue.currency.toLowerCase(),
      min_value: propsValue.min_value ?? 1000000,
      limit: Math.min(propsValue.limit ?? 25, 100),
    };

    // Default start to last 3600 seconds if not provided
    params['start'] = propsValue.start ?? Math.floor(Date.now() / 1000) - 3600;

    if (propsValue.end !== undefined) params['end'] = propsValue.end;
    if (propsValue.cursor) params['cursor'] = propsValue.cursor;

    const result = await makeWhaleAlertRequest<WhaleAlertResponse>(auth as string, '/transactions', params);

    return {
      ...result,
      search_currency: propsValue.currency.toUpperCase(),
      min_value_usd: params['min_value'],
    };
  },
});
