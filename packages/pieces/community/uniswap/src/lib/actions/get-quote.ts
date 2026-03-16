import { createAction, Property } from '@activepieces/pieces-framework';
import { getQuote } from '../uniswap-api';

export const getQuoteAction = createAction({
  name: 'get_quote',
  displayName: 'Get Swap Quote',
  description:
    'Get the best swap route and price quote for a token pair on Uniswap.',
  props: {
    tokenInAddress: Property.ShortText({
      displayName: 'Token In Address',
      description:
        'The contract address of the input token (use "ETH" or "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" for native ETH)',
      required: true,
      defaultValue: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    }),
    tokenOutAddress: Property.ShortText({
      displayName: 'Token Out Address',
      description: 'The contract address of the output token',
      required: true,
      defaultValue: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    }),
    tokenInChainId: Property.StaticDropdown({
      displayName: 'Token In Chain',
      description: 'The blockchain network for the input token',
      required: true,
      defaultValue: 1,
      options: {
        options: [
          { label: 'Ethereum', value: 1 },
          { label: 'Polygon', value: 137 },
          { label: 'Arbitrum', value: 42161 },
          { label: 'Optimism', value: 10 },
          { label: 'Base', value: 8453 },
          { label: 'BNB Chain', value: 56 },
        ],
      },
    }),
    tokenOutChainId: Property.StaticDropdown({
      displayName: 'Token Out Chain',
      description: 'The blockchain network for the output token',
      required: true,
      defaultValue: 1,
      options: {
        options: [
          { label: 'Ethereum', value: 1 },
          { label: 'Polygon', value: 137 },
          { label: 'Arbitrum', value: 42161 },
          { label: 'Optimism', value: 10 },
          { label: 'Base', value: 8453 },
          { label: 'BNB Chain', value: 56 },
        ],
      },
    }),
    amount: Property.ShortText({
      displayName: 'Amount (Wei)',
      description:
        'The input token amount in smallest unit (wei for ETH, e.g. 1000000000000000000 = 1 ETH)',
      required: true,
      defaultValue: '1000000000000000000',
    }),
    quoteType: Property.StaticDropdown({
      displayName: 'Quote Type',
      description:
        'EXACT_INPUT: specify exact input amount. EXACT_OUTPUT: specify exact output amount.',
      required: true,
      defaultValue: 'EXACT_INPUT',
      options: {
        options: [
          { label: 'Exact Input', value: 'EXACT_INPUT' },
          { label: 'Exact Output', value: 'EXACT_OUTPUT' },
        ],
      },
    }),
  },
  async run(context) {
    const { tokenInAddress, tokenOutAddress, tokenInChainId, tokenOutChainId, amount, quoteType } =
      context.propsValue;

    const result = await getQuote({
      tokenInAddress,
      tokenOutAddress,
      tokenInChainId: Number(tokenInChainId),
      tokenOutChainId: Number(tokenOutChainId),
      amount,
      type: quoteType as 'EXACT_INPUT' | 'EXACT_OUTPUT',
    });

    return result;
  },
});
