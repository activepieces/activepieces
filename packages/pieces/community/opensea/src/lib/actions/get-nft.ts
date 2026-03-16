import { createAction, Property } from '@activepieces/pieces-framework';
import { openSeaAuth } from '../auth';
import { getNft } from '../opensea-api';

export const getNftAction = createAction({
  auth: openSeaAuth,
  name: 'get_nft',
  displayName: 'Get NFT',
  description: 'Get metadata and details for a single NFT by contract address and token ID.',
  props: {
    chain: Property.StaticDropdown({
      displayName: 'Chain',
      description: 'The blockchain the NFT is on.',
      required: true,
      defaultValue: 'ethereum',
      options: {
        options: [
          { label: 'Ethereum', value: 'ethereum' },
          { label: 'Polygon', value: 'matic' },
          { label: 'Arbitrum', value: 'arbitrum' },
          { label: 'Optimism', value: 'optimism' },
          { label: 'Base', value: 'base' },
          { label: 'Solana', value: 'solana' },
          { label: 'Avalanche', value: 'avalanche' },
          { label: 'BNB Chain', value: 'bsc' },
          { label: 'Klaytn', value: 'klaytn' },
          { label: 'Zora', value: 'zora' },
        ],
      },
    }),
    address: Property.ShortText({
      displayName: 'Contract Address',
      description: 'The contract address of the NFT collection.',
      required: true,
    }),
    identifier: Property.ShortText({
      displayName: 'Token ID',
      description: 'The token identifier (ID) of the NFT.',
      required: true,
    }),
  },
  async run(context) {
    const { chain, address, identifier } = context.propsValue;
    return await getNft(context.auth, chain, address, identifier);
  },
});
