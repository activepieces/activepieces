import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseModeration } from '../../common/moderation';
import { discourseSchemas } from '../../common/schemas';

export const activateUserAction = createAction({
  auth: discourseAuth,
  name: 'activate_user',
  classification: 'WRITE',
  displayName: 'Activate User',
  description: 'Activates a Discourse user account without email confirmation.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Activate a Discourse user account by numeric user ID, as if they had confirmed their email. Needs an admin key and should follow an explicit request. Safe to retry.',
    idempotent: true,
  },
  props: {
    user_id: Property.ShortText({ displayName: 'User ID', description: 'Numeric user ID.', required: true }),
  },
  outputSchema: discourseSchemas.moderation,
  async run({ auth, propsValue }) {
    return discourseModeration.moderate({
      auth: auth.props,
      userId: propsValue.user_id,
      action: 'activate',
      method: HttpMethod.PUT,
    });
  },
});
