import { createAction, Property } from '@activepieces/pieces-framework';
import { alchemyAuth } from '../..';
import { alchemyRpcRequest } from '../common/alchemy-api';

interface AssetTransfer {
  blockNum: string;
  uniqueId: string;
  hash: string;
  from: string;
  to: string;
  value?: number;
  erc721TokenId?: string;
  erc1155Metadata?: Record<string, unknown>[];
  tokenId?: string;
  asset?: string;
  category: string;
  rawContract?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

interface AssetTransfersResponse {
  transfers: AssetTransfer[];
  pageKey?: string;
}

export const getAssetTransfers = createAction({
  name: 'get_asset_transfers',
  displayName: 'Get Asset Transfers',
  description:
    'Get ERC-20, ERC-721, ERC-1155, and external transfers to a wallet address.',
  auth: alchemyAuth,
  requireAuth: true,
  props: {
    address: Property.ShortText({
      displayName: 'Wallet Address',
      description: 'The EVM wallet address to get transfers for.',
      required: true,
    }),
    max_count: Property.Number({
      displayName: 'Max Count',
      description: 'Maximum number of transfers to return.',
      required: false,
      defaultValue: 10,
    }),
    network: Property.StaticDropdown({
      displayName: 'Network',
      description: 'The blockchain network to query.',
      required: true,
      defaultValue: 'eth-mainnet',
      options: {
        options: [
          { label: 'Ethereum Mainnet', value: 'eth-mainnet' },
          { label: 'Polygon', value: 'polygon-mainnet' },
          { label: 'Arbitrum', value: 'arb-mainnet' },
          { label: 'Optimism', value: 'opt-mainnet' },
          { label: 'Base', value: 'base-mainnet' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const limit = propsValue.max_count ?? 10;
    const maxCount = '0x' + limit.toString(16);

    const data = await alchemyRpcRequest<AssetTransfersResponse>(
      auth as string,
      propsValue.network as string,
      'alchemy_getAssetTransfers',
      [
        {
          fromBlock: '0x0',
          toBlock: 'latest',
          toAddress: propsValue.address,
          maxCount,
          category: ['erc20', 'erc721', 'erc1155', 'external'],
        },
      ]
    );

    return {
      transfer_count: data.transfers.length,
      page_key: data.pageKey,
      transfers: data.transfers,
    };
  },
});
