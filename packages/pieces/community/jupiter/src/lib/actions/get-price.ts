import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getPrice = createAction({
  name: 'get_price',
  displayName: 'Get Token Price',
  description:
    'Get the current USD price for one or more Solana token mints using Jupiter Price API.',
  props: {
    ids: Property.ShortText({
      displayName: 'Token Mint Addresses',
      description:
        'Comma-separated list of mint addresses. e.g. So11111111111111111111111111111111111111112,EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      required: true,
    }),
    vsToken: Property.ShortText({
      displayName: 'VS Token Mint (optional)',
      description: 'Compare prices against this token mint address instead of USD.',
      required: false,
    }),
  },
  async run(context) {
    const { ids, vsToken } = context.propsValue;

    const queryParams: Record<string, string> = { ids };
    if (vsToken) queryParams['vsToken'] = vsToken;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://price.jup.ag/v6/price',
      queryParams,
    });

    return response.body;
  },
});
