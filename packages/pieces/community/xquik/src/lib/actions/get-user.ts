import { createAction, Property } from '@activepieces/pieces-framework';
import { xquikAuth } from '../auth';
import { xquikCommon } from '../common';

export const getUser = createAction({
  auth: xquikAuth,
  name: 'get_user',
  displayName: 'Get User',
  description: 'Look up a public X/Twitter user by username or user ID',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves a single public X/Twitter user profile, identified either by username (with or without the @) or by numeric user ID. Use to resolve an account to its profile details. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    user: Property.ShortText({
      displayName: 'User',
      description: 'Username with or without @, or a numeric user ID.',
      required: true,
    }),
  },
  async run(context) {
    const user = xquikCommon.utils.stripAtPrefix(context.propsValue.user);

    return xquikCommon.api.get({
      apiKey: context.auth.secret_text,
      path: `/x/users/${xquikCommon.utils.encodePathPart(user)}`,
    });
  },
});
