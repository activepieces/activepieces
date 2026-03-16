import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getQuote = createAction({
  name: 'get_quote',
  displayName: 'Get Swap Quote',
  description:
    'Get a real-time swap quote between two Solana tokens on Jupiter DEX aggregator.',
  props: {
    inputMint: Property.ShortText({
      displayName: 'Input Token Mint',
      description:
        'Mint address of the token to swap FROM (e.g. So11111111111111111111111111111111111111112 for SOL).',
      required: true,
    }),
    outputMint: Property.ShortText({
      displayName: 'Output Token Mint',
      description:
        'Mint address of the token to swap TO (e.g. EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v for USDC).',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount (smallest unit)',
      description:
        'Amount of the input token in its smallest denomination. For SOL multiply by 1,000,000,000 to get lamports.',
      required: true,
    }),
    slippageBps: Property.Number({
      displayName: 'Slippage (basis points)',
      description: 'Max allowed slippage in basis points. 50 = 0.5%, 100 = 1%. Default: 50.',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const { inputMint, outputMint, amount, slippageBps } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://quote-api.jup.ag/v6/quote',
      queryParams: {
        inputMint,
        outputMint,
        amount: String(amount),
        slippageBps: String(slippageBps ?? 50),
      },
    });

    return response.body;
  },
});
