import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditGetMyPreferencesOutputSchema } from '../../output-schemas';

export const redditGetMyPreferences = createAction({
  auth: redditAuth,
  name: 'reddit_get_my_preferences',
  outputSchema: redditGetMyPreferencesOutputSchema,
  displayName: 'Get My Preferences',
  description: 'Gets the connected account\'s Reddit preference settings.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the connected account\'s settings as one object: language, NSFW visibility, default comment sort, inbox and email notification switches, who can message you, and similar preferences. Read-only.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return redditApi.request<Record<string, unknown>>({ auth, method: HttpMethod.GET, path: '/api/v1/me/prefs' });
  },
});
