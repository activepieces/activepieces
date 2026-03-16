import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroExRequest, CHAIN_OPTIONS } from '../0x-api';
import { zeroExAuth } from '../../index';

export const getOrderbookOrders = createAction({
  name: 'get_orderbook_orders',
  displayName: 'Get Orderbook Orders',
  description: 'Retrieve open limit orders from the 0x orderbook for a given chain and optional token pair.',
  auth: zeroExAuth,
  props: {
    chainId: Property.StaticDropdown({
      displayName: 'Chain',
      description: 'The blockchain network to query.',
      required: true,
      options: {
        options: CHAIN_OPTIONS,
      },
    }),
    makerToken: Property.ShortText({
      displayName: 'Maker Token',
      description: '(Optional) Filter by maker token contract address.',
      required: false,
    }),
    takerToken: Property.ShortText({
      displayName: 'Taker Token',
      description: '(Optional) Filter by taker token contract address.',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination (default: 1).',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const { chainId, makerToken, takerToken, page } = context.propsValue;
    return zeroExRequest(
      context.auth as string,
      chainId,
      '/orderbook/v1/orders',
      {
        makerToken: makerToken ?? undefined,
        takerToken: takerToken ?? undefined,
        page: page ? String(page) : '1',
      }
    );
  },
});
