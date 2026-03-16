import { createAction, Property } from '@activepieces/pieces-framework';
import { getLatestTokenProfiles } from '../dexscreener-api';

export const getTokenProfilesAction = createAction({
  name: 'get_token_profiles',
  displayName: 'Get Token Profiles',
  description: 'Get the latest token profiles and metadata from DexScreener.',
  props: {
    limit: Property.Number({
      displayName: 'Result Limit',
      description: 'Maximum number of token profiles to return (default: 20).',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { limit } = context.propsValue;
    const profiles = await getLatestTokenProfiles();
    const maxResults = limit ?? 20;
    return {
      profiles: profiles.slice(0, maxResults),
      total: profiles.length,
    };
  },
});
