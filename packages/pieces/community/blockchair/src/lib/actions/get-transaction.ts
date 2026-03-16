import { createAction, Property } from '@activepieces/pieces-framework';
import { blockchairRequest, SUPPORTED_BLOCKCHAINS } from '../common/blockchair-api';

export const getTransaction = createAction({
  name: 'get_transaction',
  displayName: 'Get Transaction',
  description:
    'Get full transaction details by transaction hash, including inputs, outputs, and fees.',
  props: {
    blockchain: Property.StaticDropdown({
      displayName: 'Blockchain',
      description: 'The blockchain the transaction is on',
      required: true,
      options: {
        options: SUPPORTED_BLOCKCHAINS,
      },
    }),
    hash: Property.ShortText({
      displayName: 'Transaction Hash',
      description: 'The transaction hash (txid) to look up',
      required: true,
    }),
  },
  async run(context) {
    const apiKey = context.auth as string | undefined;
    const { blockchain, hash } = context.propsValue;
    return await blockchairRequest(
      `/${blockchain}/dashboards/transaction/${hash}`,
      apiKey
    );
  },
});
