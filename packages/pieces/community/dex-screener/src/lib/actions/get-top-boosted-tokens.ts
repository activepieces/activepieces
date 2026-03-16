import { createAction, Property } from '@activepieces/pieces-framework';
import { getTopBoostedTokens } from '../dexscreener-api';

export const getTopBoostedTokensAction = createAction({
  name: 'get_top_boosted_tokens',
  displayName: 'Get Top Boosted Tokens',
  description: 'Get the tokens with the most active boosts on DexScreener.',
  props: {
    limit: Property.Number({
      displayName: 'Result Limit',
      description: 'Maximum number of tokens to return (default: 20).',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { limit } = context.propsValue;
    const tokens = await getTopBoostedTokens();
    const maxResults = limit ?? 20;
    return {
      tokens: tokens.slice(0, maxResults),
      total: tokens.length,
    };
  },
});
