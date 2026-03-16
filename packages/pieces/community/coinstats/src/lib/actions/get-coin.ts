import { createAction, Property } from '@activepieces/pieces-framework';
import { coinstatsAuth } from '../../index';
import { makeClient } from '../coinstats-api';

export const getCoin = createAction({
  name: 'get_coin',
  displayName: 'Get Coin',
  description: 'Get detailed information for a specific cryptocurrency including price, market cap, ATH, and more.',
  auth: coinstatsAuth,
  props: {
    coinId: Property.ShortText({
      displayName: 'Coin ID',
      description: 'The CoinStats coin ID (e.g. "bitcoin", "ethereum")',
      required: true,
    }),
  },
  async run(context) {
    const client = makeClient(context.auth);
    return await client.getCoin(context.propsValue.coinId);
  },
});
