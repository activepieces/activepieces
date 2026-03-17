import { createAction, Property } from '@activepieces/pieces-framework';

export const getWalletBalance = createAction({
  name: 'getWalletBalance',
  displayName: 'Get Wallet Balance',
  description: 'Fetch the AR token balance for a given Arweave wallet address.',
  auth: undefined,
  props: {
    address: Property.ShortText({
      displayName: 'Wallet Address',
      description: 'The Arweave wallet address (43-character base64url string).',
      required: true,
    }),
  },
  async run(context) {
    const { address } = context.propsValue;
    const trimmedAddress = address.trim();

    if (!/^[a-zA-Z0-9_-]{43}$/.test(trimmedAddress)) {
      throw new Error('Invalid Arweave wallet address. Must be a 43-character base64url string.');
    }

    const response = await fetch(`https://arweave.net/wallet/${trimmedAddress}/balance`);

    if (!response.ok) {
      throw new Error(`Arweave API error: ${response.status} ${response.statusText}`);
    }

    const winstonBalance = await response.text();
    const arBalance = Number(BigInt(winstonBalance.trim())) / 1e12;

    return {
      address: trimmedAddress,
      balance_winston: winstonBalance.trim(),
      balance_ar: arBalance,
    };
  },
});
