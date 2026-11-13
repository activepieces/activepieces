import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostListPreferencesOutputSchema } from '../../../output-schemas';

export const listPreferencesByCategoryAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_preferences_by_category',
  outputSchema: mattermostListPreferencesOutputSchema,
  displayName: 'List Preferences By Category',
  description: 'Lists a user\'s preferences in one category.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns a user\'s saved preferences in one category, e.g. "display_settings"; pass "me" for the connected account. Category names come from List Preferences; for one preference use Get Preference.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    category: Property.ShortText({
      displayName: 'Category',
      description: 'Preference category, e.g. "display_settings", "notifications" or "favorite_channel".',
      required: true,
    }),
  },
  async run(context) {
    const { userId, category } = context.propsValue;
    const preferences = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/users/${encodeURIComponent(userId)}/preferences/${encodeURIComponent(category)}`,
    });
    return { preferences, count: preferences.length };
  },
});
