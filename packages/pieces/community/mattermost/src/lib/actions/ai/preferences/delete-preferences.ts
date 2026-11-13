import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const deletePreferencesAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_delete_preferences',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Delete Preferences',
  description: 'Deletes preferences of a user.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes the listed preferences (matched by user_id, category and name) of a user, so they fall back to their defaults. Another user needs permission to edit other users. The entries to delete come from List Preferences.',
    idempotent: false,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    preferences: Property.Json({
      displayName: 'Preferences',
      description:
        'JSON array of up to 100 preferences to delete, each {"user_id", "category", "name", "value"} as returned by List Preferences. user_id is the 26-character ID of the same user (not "me").',
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
      method: HttpMethod.POST,
      path: `/users/${encodeURIComponent(userId)}/preferences/delete`,
      body: preferences,
    });
  },
});
