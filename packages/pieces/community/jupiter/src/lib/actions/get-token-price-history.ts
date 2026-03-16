import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTokenPriceHistory = createAction({
  name: 'get_token_price_history',
  displayName: 'Get Token Price History',
  description:
    'Fetch current price snapshot for a Solana token from Jupiter Price API, with timestamp and metadata.',
  props: {
    mint: Property.ShortText({
      displayName: 'Token Mint Address',
      description:
        'Mint address of the token (e.g. So11111111111111111111111111111111111111112 for SOL).',
      required: true,
    }),
    vsToken: Property.ShortText({
      displayName: 'VS Token Mint (optional)',
      description: 'Price the token relative to this mint address. Leave blank for USD.',
      required: false,
    }),
  },
  async run(context) {
    const { mint, vsToken } = context.propsValue;

    const queryParams: Record<string, string> = { ids: mint };
    if (vsToken) queryParams['vsToken'] = vsToken;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://price.jup.ag/v6/price',
      queryParams,
    });

    const body = response.body as Record<string, unknown>;
    const dataMap = body?.['data'] as Record<string, unknown> | undefined;
    const tokenData = dataMap?.[mint] as Record<string, unknown> | undefined;

    return {
      mint,
      mintSymbol: tokenData?.['mintSymbol'],
      currentPrice: tokenData?.['price'],
      vsToken: tokenData?.['vsToken'],
      vsTokenSymbol: tokenData?.['vsTokenSymbol'],
      timestamp: new Date().toISOString(),
      raw: body,
    };
  },
});
