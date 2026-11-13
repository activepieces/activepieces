import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseModeration } from '../../common/moderation';
import { discourseSchemas } from '../../common/schemas';

export const unsuspendUserAction = createAction({
  auth: discourseAuth,
  name: 'unsuspend_user',
  classification: 'WRITE',
  displayName: 'Unsuspend User',
  description: 'Lifts the suspension of a Discourse user.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lift the suspension of a Discourse user by numeric user ID so they can log in again. Moderation action: needs an admin or moderator key and should follow an explicit request. Safe to retry.',
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
      action: 'unsuspend',
      method: HttpMethod.PUT,
    });
  },
});
