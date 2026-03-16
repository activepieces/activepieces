import { createAction, Property } from '@activepieces/pieces-framework';
import { blockchairRequest, SUPPORTED_BLOCKCHAINS } from '../common/blockchair-api';

export const getBlock = createAction({
  name: 'get_block',
  displayName: 'Get Block',
  description:
    'Get block details by block height or block hash, including transaction count and miner information.',
  props: {
    blockchain: Property.StaticDropdown({
      displayName: 'Blockchain',
      description: 'The blockchain the block is on',
      required: true,
      options: {
        options: SUPPORTED_BLOCKCHAINS,
      },
    }),
    blockId: Property.ShortText({
      displayName: 'Block Height or Hash',
      description: 'Block height (number) or block hash to look up',
      required: true,
    }),
  },
  async run(context) {
    const apiKey = context.auth as string | undefined;
    const { blockchain, blockId } = context.propsValue;
    return await blockchairRequest(
      `/${blockchain}/dashboards/block/${blockId}`,
      apiKey
    );
  },
});
