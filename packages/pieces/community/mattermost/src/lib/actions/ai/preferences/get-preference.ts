import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostGetPreferenceOutputSchema } from '../../../output-schemas';

export const getPreferenceAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_preference',
  outputSchema: mattermostGetPreferenceOutputSchema,
  displayName: 'Get Preference',
  description: 'Gets one preference of a user.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one saved preference of a user by category and name; pass "me" for the connected account. Fails when it was never set. Categories and names come from List Preferences.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    category: Property.ShortText({
      displayName: 'Category',
      description: 'Preference category, e.g. "display_settings".',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Preference name within the category, e.g. "use_military_time".',
      required: true,
    }),
  },
  async run(context) {
    const { userId, category, name } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/users/${encodeURIComponent(userId)}/preferences/${encodeURIComponent(category)}/name/${encodeURIComponent(name)}`,
    });
  },
});
