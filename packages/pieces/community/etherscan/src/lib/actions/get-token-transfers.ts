import { createAction, Property } from '@activepieces/pieces-framework';
import { etherscanAuth } from '../..';
import { etherscanRequest } from '../common/etherscan-api';

interface TokenTransfer {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  contractAddress: string;
}

export const getTokenTransfers = createAction({
  name: 'get_token_transfers',
  displayName: 'Get Token Transfers',
  description: 'Get ERC-20 token transfer events for an Ethereum address.',
  auth: etherscanAuth,
  requireAuth: true,
  props: {
    address: Property.ShortText({
      displayName: 'Address',
      description: 'Ethereum address (0x...)',
      required: true,
    }),
    contractAddress: Property.ShortText({
      displayName: 'Contract Address',
      description: 'Filter by specific token contract address (optional)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of transfers to return (max 10000)',
      required: false,
      defaultValue: 10,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort Order',
      required: false,
      defaultValue: 'desc',
      options: {
        disabled: false,
        options: [
          { label: 'Newest First', value: 'desc' },
          { label: 'Oldest First', value: 'asc' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const limit = Math.min(Math.max(1, propsValue.limit ?? 10), 10000);
    const sort = propsValue.sort ?? 'desc';

    const params: Record<string, string> = {
      module: 'account',
      action: 'tokentx',
      address: propsValue.address,
      page: '1',
      offset: String(limit),
      startblock: '0',
      endblock: '99999999',
      sort: sort,
    };

    if (propsValue.contractAddress) {
      params['contractaddress'] = propsValue.contractAddress;
    }

    const response = await etherscanRequest<TokenTransfer[]>(
      auth as string,
      params
    );

    return {
      address: propsValue.address,
      count: Array.isArray(response.result) ? response.result.length : 0,
      transfers: response.result,
    };
  },
});
