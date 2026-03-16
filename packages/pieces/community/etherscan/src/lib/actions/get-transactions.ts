import { createAction, Property } from '@activepieces/pieces-framework';
import { etherscanAuth } from '../..';
import { etherscanRequest } from '../common/etherscan-api';

interface Transaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasUsed: string;
  isError: string;
}

export const getTransactions = createAction({
  name: 'get_transactions',
  displayName: 'Get Transactions',
  description: 'Get the last N normal transactions for an Ethereum address.',
  auth: etherscanAuth,
  requireAuth: true,
  props: {
    address: Property.ShortText({
      displayName: 'Address',
      description: 'Ethereum address (0x...)',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of transactions to return (max 10000)',
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
    const limit = propsValue.limit ?? 10;
    const sort = propsValue.sort ?? 'desc';

    const response = await etherscanRequest<Transaction[]>(auth as string, {
      module: 'account',
      action: 'txlist',
      address: propsValue.address,
      startblock: '0',
      endblock: '99999999',
      page: '1',
      offset: String(limit),
      sort: sort,
    });

    return {
      address: propsValue.address,
      count: Array.isArray(response.result) ? response.result.length : 0,
      transactions: response.result,
    };
  },
});
