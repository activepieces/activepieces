import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const savePreferencesAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_save_preferences',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Save Preferences',
  description: 'Creates or updates preferences of a user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates or overwrites up to 100 preferences (user_id, category, name, value) of a user; preferences not listed are left alone. Another user needs permission to edit other users. Existing categories and names come from List Preferences.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    preferences: Property.Json({
      displayName: 'Preferences',
      description:
        'JSON array of 1 to 100 preferences, each {"user_id", "category", "name", "value"}. user_id is the 26-character ID of the same user (not "me"), e.g. [{"user_id": "...", "category": "display_settings", "name": "use_military_time", "value": "true"}].',
      required: true,
    }),
  },
  async run(context) {
    const { userId, preferences } = context.propsValue;
    if (!Array.isArray(preferences)) {
      throw new Error('Preferences must be a JSON array of {user_id, category, name, value} objects.');
    }
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/users/${encodeURIComponent(userId)}/preferences`,
      body: preferences,
    });
  },
});
