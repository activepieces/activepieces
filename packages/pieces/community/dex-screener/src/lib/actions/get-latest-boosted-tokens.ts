import { createAction, Property } from '@activepieces/pieces-framework';
import { getLatestBoostedTokens } from '../dexscreener-api';

export const getLatestBoostedTokensAction = createAction({
  name: 'get_latest_boosted_tokens',
  displayName: 'Get Latest Boosted Tokens',
  description: 'Get the latest boosted (trending/promoted) tokens on DexScreener.',
  props: {
    limit: Property.Number({
      displayName: 'Result Limit',
      description: 'Maximum number of boosted tokens to return (default: 20).',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { limit } = context.propsValue;
    const tokens = await getLatestBoostedTokens();
    const maxResults = limit ?? 20;
    return {
      tokens: tokens.slice(0, maxResults),
      total: tokens.length,
    };
  },
});
