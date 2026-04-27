import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aiprise } from '../common';
import { aipriseAuth } from '../../';

export const getUserProfileAction = createAction({
  auth: aipriseAuth,
  name: 'get_user_profile',
  displayName: 'Get User Profile',
  description:
    "Fetches a user profile from AiPrise by its ID — including the person's stored details, tags, linked verification sessions, and metadata.",
  props: {
    user_profile_id: Property.ShortText({
      displayName: 'User Profile ID',
      description:
        'The ID of the user profile to retrieve. You can get this from the output of the **Create User Profile** action, or from the `user_profile_id` field in any webhook payload from AiPrise.',
      required: true,
    }),
  },
  async run(context) {
    const { user_profile_id } = context.propsValue;
    return aiprise.makeRequest<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/verify/get_user_profile/${encodeURIComponent(user_profile_id)}`,
    });
  },
});
