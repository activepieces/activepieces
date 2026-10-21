import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseModeration } from '../../common/moderation';
import { discourseSchemas } from '../../common/schemas';

export const unsilenceUserAction = createAction({
  auth: discourseAuth,
  name: 'unsilence_user',
  classification: 'WRITE',
  displayName: 'Unsilence User',
  description: 'Lets a silenced Discourse user post again.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Remove the silence from a Discourse user by numeric user ID so they can post again. Moderation action: needs an admin or moderator key and should follow an explicit request. Safe to retry.',
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
      action: 'unsilence',
      method: HttpMethod.PUT,
    });
  },
});
