import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseModeration } from '../../common/moderation';
import { discourseSchemas } from '../../common/schemas';

export const logOutUserAction = createAction({
  auth: discourseAuth,
  name: 'log_out_user',
  classification: 'WRITE',
  displayName: 'Log Out User',
  description: 'Signs a Discourse user out of all sessions.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sign a Discourse user out of every browser and device session by numeric user ID, for example after a suspected account compromise. Needs an admin key and an explicit request. They can log in again normally. Safe to retry.',
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
      action: 'log_out',
      method: HttpMethod.POST,
    });
  },
});
