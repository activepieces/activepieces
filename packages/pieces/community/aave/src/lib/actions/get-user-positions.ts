import { createAction, Property } from '@activepieces/pieces-framework';
import { aaveAuth } from '../aave-auth';
import { getUserPositions } from '../aave-api';

export const getUserPositionsAction = createAction({
  auth: aaveAuth,
  name: 'get_user_positions',
  displayName: 'Get User Positions',
  description:
    "Fetch a wallet address's current Aave V3 positions including deposits (supplied assets) and borrows.",
  props: {
    user_address: Property.ShortText({
      displayName: 'Wallet Address',
      description:
        'The Ethereum wallet address to fetch Aave positions for (e.g. 0x1234...abcd).',
      required: true,
    }),
  },
  async run(context) {
    const apiKey = context.auth as string | undefined;
    const { user_address } = context.propsValue;

    if (!user_address.startsWith('0x') || user_address.length !== 42) {
      throw new Error(
        'Invalid Ethereum address. Must be a 42-character hex string starting with 0x.'
      );
    }

    const positions = await getUserPositions(user_address, apiKey);

    const positionList = positions as Array<{
      currentATokenBalance: string;
      currentVariableDebt: string;
      currentStableDebt: string;
      reserve: { symbol: string; name: string; decimals: number };
    }>;

    const supplied = positionList.filter(
      (p) => BigInt(p.currentATokenBalance || '0') > BigInt(0)
    );
    const borrowed = positionList.filter(
      (p) =>
        BigInt(p.currentVariableDebt || '0') > BigInt(0) ||
        BigInt(p.currentStableDebt || '0') > BigInt(0)
    );

    return {
      userAddress: user_address.toLowerCase(),
      totalPositions: positionList.length,
      suppliedCount: supplied.length,
      borrowedCount: borrowed.length,
      positions: positionList,
    };
  },
});
