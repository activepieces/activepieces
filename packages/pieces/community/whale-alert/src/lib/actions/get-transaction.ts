import { createAction, Property } from '@activepieces/pieces-framework';
import { whaleAlertAuth } from '../../index';
import { makeWhaleAlertRequest } from '../common/whale-alert-api';

export const getTransaction = createAction({
  auth: whaleAlertAuth,
  name: 'get_transaction',
  displayName: 'Get Transaction',
  description: 'Get a specific transaction by blockchain and transaction hash.',
  props: {
    blockchain: Property.StaticDropdown({
      displayName: 'Blockchain',
      description: 'The blockchain the transaction is on.',
      required: true,
      options: {
        options: [
          { label: 'Bitcoin', value: 'bitcoin' },
          { label: 'Ethereum', value: 'ethereum' },
          { label: 'Ripple (XRP)', value: 'ripple' },
          { label: 'Tron', value: 'tron' },
          { label: 'Cardano', value: 'cardano' },
          { label: 'Solana', value: 'solana' },
          { label: 'Litecoin', value: 'litecoin' },
          { label: 'Bitcoin Cash', value: 'bitcoin_cash' },
          { label: 'Dogecoin', value: 'dogecoin' },
          { label: 'Polygon', value: 'polygon' },
          { label: 'Algorand', value: 'algorand' },
        ],
      },
    }),
    hash: Property.ShortText({
      displayName: 'Transaction Hash / ID',
      description: 'The transaction hash or ID to look up.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return makeWhaleAlertRequest(
      auth as string,
      `/transaction/${propsValue.blockchain}/${propsValue.hash}`,
      {}
    );
  },
});
