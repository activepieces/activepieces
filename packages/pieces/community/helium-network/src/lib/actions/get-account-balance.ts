import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

export const getAccountBalance = createAction({
  name: 'get_account_balance',
  displayName: 'Get Account Balance',
  description: 'Get HNT, MOBILE, and IOT token balances for a Helium wallet address.',
  props: {
    wallet_address: Property.ShortText({
      displayName: 'Wallet Address',
      description: 'The Solana wallet address (or legacy Helium address) to query balances for.',
      required: true,
    }),
  },
  async run(context) {
    const { wallet_address } = context.propsValue;

    // Fetch account info from Helium API
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.helium.io/v1/accounts/${wallet_address}`,
    });

    const account = response.body?.data;
    if (!account) {
      throw new Error(`No account data found for address: ${wallet_address}`);
    }

    // Convert balance from bones to HNT (1 HNT = 100,000,000 bones)
    const hntBalance = account.balance ? account.balance / 1e8 : 0;
    const dcBalance = account.dc_balance ?? 0;
    const secBalance = account.sec_balance ? account.sec_balance / 1e8 : 0;

    return {
      address: wallet_address,
      hnt_balance: hntBalance,
      hnt_balance_bones: account.balance ?? 0,
      dc_balance: dcBalance,
      security_token_balance: secBalance,
      block: account.block,
      staked_balance: account.staked_balance ? account.staked_balance / 1e8 : 0,
    };
  },
});
