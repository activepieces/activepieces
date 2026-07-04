import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aiprise } from '../common';
import { aipriseAuth } from '../common/auth';

export const getUserProfileAction = createAction({
  auth: aipriseAuth,
  name: 'get_user_profile',
  displayName: 'Get User Profile',
  description:
    "Fetches a user profile from AiPrise by its ID — including the person's stored details, tags, linked verification sessions, and metadata.",
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a single user (person) profile by its ID, returning the stored identity details, tags, linked verification sessions, and metadata. Use this to read back a profile you created or referenced. Requires the user_profile_id. Read-only and idempotent.',
    idempotent: true,
  },
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
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/verify/get_user_profile/${encodeURIComponent(user_profile_id)}`,
    });
  },
});
