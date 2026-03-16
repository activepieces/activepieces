import { createAction, Property } from '@activepieces/pieces-framework';
import { coinstatsAuth } from '../../index';
import { makeClient } from '../coinstats-api';

export const getCoins = createAction({
  name: 'get_coins',
  displayName: 'Get Coins',
  description: 'List cryptocurrencies with real-time market data including price, market cap, and volume.',
  auth: coinstatsAuth,
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of coins to return (max 1000)',
      required: false,
      defaultValue: 20,
    }),
    skip: Property.Number({
      displayName: 'Skip',
      description: 'Number of coins to skip for pagination',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const client = makeClient(context.auth);
    return await client.getCoins({
      limit: context.propsValue.limit ?? 20,
      skip: context.propsValue.skip ?? 0,
    });
  },
});
