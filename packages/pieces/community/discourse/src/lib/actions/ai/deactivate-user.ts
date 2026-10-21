import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseModeration } from '../../common/moderation';
import { discourseSchemas } from '../../common/schemas';

export const deactivateUserAction = createAction({
  auth: discourseAuth,
  name: 'deactivate_user',
  classification: 'WRITE',
  displayName: 'Deactivate User',
  description: 'Deactivates a Discourse user account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deactivate a Discourse user account by numeric user ID so they cannot log in until they re-confirm their email or are activated again. Moderation action: needs an admin key and an explicit request. Reversible with Activate User; safe to retry.',
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
      action: 'deactivate',
      method: HttpMethod.PUT,
    });
  },
});
