import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostListPreferencesOutputSchema } from '../../../output-schemas';

export const listPreferencesAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_preferences',
  outputSchema: mattermostListPreferencesOutputSchema,
  displayName: 'List Preferences',
  description: 'Lists all preferences of a user.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns every saved preference (category, name, value) of a user; pass "me" for the connected account. To read one category use List Preferences By Category.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
  },
  async run(context) {
    const preferences = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/users/${encodeURIComponent(context.propsValue.userId)}/preferences`,
    });
    return { preferences, count: preferences.length };
  },
});
