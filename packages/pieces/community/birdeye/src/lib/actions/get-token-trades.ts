import { createAction, Property } from '@activepieces/pieces-framework';
import { birdeyeAuth } from '../../index';
import { birdeyeRequest } from '../common/birdeye-api';
import { CHAIN_OPTIONS } from '../common/chain-dropdown';

export const getTokenTrades = createAction({
  auth: birdeyeAuth,
  name: 'get_token_trades',
  displayName: 'Get Token Trades',
  description: 'Fetch recent trades and transactions for a token, showing buys/sells with timestamps and amounts.',
  props: {
    address: Property.ShortText({
      displayName: 'Token Address',
      description: 'The token contract address (or mint address for Solana)',
      required: true,
    }),
    chain: Property.StaticDropdown({
      displayName: 'Chain',
      description: 'The blockchain network to query',
      required: true,
      options: { options: CHAIN_OPTIONS },
      defaultValue: 'solana',
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of trades to return (max 50)',
      required: false,
      defaultValue: 20,
    }),
    tx_type: Property.StaticDropdown({
      displayName: 'Transaction Type',
      description: 'Filter by transaction type',
      required: false,
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Buy', value: 'buy' },
          { label: 'Sell', value: 'sell' },
          { label: 'Add Liquidity', value: 'add' },
          { label: 'Remove Liquidity', value: 'remove' },
        ],
      },
      defaultValue: 'all',
    }),
  },
  async run(context) {
    return birdeyeRequest(context.auth, '/defi/txs/token', {
      address: context.propsValue.address,
      chain: context.propsValue.chain as string,
      limit: context.propsValue.limit ?? 20,
      tx_type: context.propsValue.tx_type as string,
    });
  },
});
