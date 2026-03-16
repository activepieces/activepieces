import { createAction, Property } from '@activepieces/pieces-framework';
import { geckoTerminalApiCall } from '../geckoterminal-api';

const NETWORKS = [
  { label: 'Ethereum', value: 'eth' },
  { label: 'Solana', value: 'solana' },
  { label: 'BNB Smart Chain', value: 'bsc' },
  { label: 'Base', value: 'base' },
  { label: 'Arbitrum', value: 'arbitrum' },
  { label: 'Polygon', value: 'polygon' },
  { label: 'Avalanche', value: 'avax' },
  { label: 'Optimism', value: 'optimism' },
];

export const getTokenPoolsAction = createAction({
  name: 'get-token-pools',
  displayName: 'Get Token Pools',
  description: 'Get all DEX pools associated with a specific token address.',
  props: {
    network: Property.StaticDropdown({
      displayName: 'Network',
      description: 'The blockchain network to query.',
      required: true,
      options: {
        options: NETWORKS,
      },
    }),
    token_address: Property.ShortText({
      displayName: 'Token Address',
      description: 'The contract address of the token.',
      required: true,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination.',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const { network, token_address, page } = context.propsValue;
    return await geckoTerminalApiCall(
      `/networks/${network}/tokens/${token_address}/pools`,
      { page: page ?? 1 }
    );
  },
});
