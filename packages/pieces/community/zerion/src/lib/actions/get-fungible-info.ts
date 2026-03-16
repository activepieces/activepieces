import { createAction, Property } from '@activepieces/pieces-framework';
import { zerionAuth } from '../auth';
import { getFungibleInfo } from '../zerion-api';

export const getFungibleInfoAction = createAction({
  auth: zerionAuth,
  name: 'get_fungible_info',
  displayName: 'Get Fungible Token Info',
  description: 'Get fungible token information including price, market cap, and 24h change by token ID.',
  props: {
    fungibleId: Property.ShortText({
      displayName: 'Token ID',
      description: 'The Zerion fungible token ID (e.g., "eth" for Ethereum, "0d8d12a7-21b9-4571-a3a7-b6c4a18e3a2d" for ERC-20 tokens).',
      required: true,
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      description: 'The currency to display values in.',
      required: false,
      defaultValue: 'usd',
      options: {
        options: [
          { label: 'USD', value: 'usd' },
          { label: 'EUR', value: 'eur' },
          { label: 'GBP', value: 'gbp' },
          { label: 'BTC', value: 'btc' },
          { label: 'ETH', value: 'eth' },
        ],
      },
    }),
  },
  async run(context) {
    const { fungibleId, currency } = context.propsValue;
    return await getFungibleInfo(context.auth, fungibleId, currency ?? 'usd');
  },
});
