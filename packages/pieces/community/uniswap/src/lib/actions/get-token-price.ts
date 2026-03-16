import { createAction, Property } from '@activepieces/pieces-framework';
import { getTokenPrice } from '../uniswap-api';

export const getTokenPriceAction = createAction({
  name: 'get_token_price',
  displayName: 'Get Token Price',
  description:
    "Get a token's current USD price derived from the Uniswap v3 subgraph (derivedETH × ETH/USD).",
  props: {
    tokenAddress: Property.ShortText({
      displayName: 'Token Address',
      description:
        'The ERC-20 token contract address on Ethereum mainnet (lowercase recommended)',
      required: true,
      defaultValue: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    }),
  },
  async run(context) {
    const { tokenAddress } = context.propsValue;
    const result = await getTokenPrice(tokenAddress) as {
      data?: {
        token?: {
          id: string;
          symbol: string;
          name: string;
          decimals: string;
          derivedETH: string;
          priceUSD: string;
          volumeUSD: string;
          txCount: string;
          totalValueLockedUSD: string;
        };
        bundle?: { ethPriceUSD: string };
      };
    };

    if (!result?.data?.token) {
      return {
        error: `Token not found: ${tokenAddress}`,
        hint: 'Ensure this is a valid ERC-20 token address that has been traded on Uniswap v3 mainnet.',
        raw: result,
      };
    }

    const token = result.data.token;
    const bundle = result.data.bundle;

    return {
      address: token.id,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      priceUSD: token.priceUSD,
      priceUSD_formatted: `$${parseFloat(token.priceUSD).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      })}`,
      derivedETH: token.derivedETH,
      ethPriceUSD: bundle?.ethPriceUSD,
      volumeUSD_allTime: token.volumeUSD,
      txCount: token.txCount,
      totalValueLockedUSD: token.totalValueLockedUSD,
    };
  },
});
