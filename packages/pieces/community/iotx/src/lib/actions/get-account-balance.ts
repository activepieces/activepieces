import { createAction, Property } from '@activepieces/pieces-framework';
import { iotexRpc } from '../common';

export const getAccountBalance = createAction({
  name: 'get_account_balance',
  displayName: 'Get Account Balance',
  description: 'Get the IOTX balance for an IoTeX address.',
  props: {
    address: Property.ShortText({
      displayName: 'Address',
      description: 'The IoTeX address (io1... or 0x... format).',
      required: true,
    }),
  },
  async run(context) {
    const { address } = context.propsValue;

    const balanceHex = (await iotexRpc('eth_getBalance', [address, 'latest'])) as string;
    const balanceWei = BigInt(balanceHex);
    const balanceIOTX = Number(balanceWei) / 1e18;

    return {
      address,
      balance_rau: balanceWei.toString(),
      balance_iotx: balanceIOTX.toFixed(6),
    };
  },
});
