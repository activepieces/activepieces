import { createAction, Property } from '@activepieces/pieces-framework';
import { blockchairRequest, SUPPORTED_BLOCKCHAINS } from '../common/blockchair-api';

export const getBlockchainStats = createAction({
  name: 'get_blockchain_stats',
  displayName: 'Get Blockchain Stats',
  description:
    'Retrieve overall statistics for a blockchain: block count, transaction count, market data, and more.',
  props: {
    blockchain: Property.StaticDropdown({
      displayName: 'Blockchain',
      description: 'The blockchain to get statistics for',
      required: true,
      options: {
        options: SUPPORTED_BLOCKCHAINS,
      },
    }),
  },
  async run(context) {
    const apiKey = context.auth as string | undefined;
    const { blockchain } = context.propsValue;
    return await blockchairRequest(`/${blockchain}/stats`, apiKey);
  },
});
