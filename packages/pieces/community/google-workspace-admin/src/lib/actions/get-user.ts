import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';

export const getUser = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'get_user',
  classification: 'READ',
  displayName: 'Get User',
  description: 'Gets the details of a user.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch one Google Workspace user by primary email, alias or user ID. Use Search Users when you only know part of the name or need several users. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    user: googleAdminProps.user({ required: true }),
  },
  async run({ auth, propsValue }) {
    const user = await googleAdminClient.getUser({ auth, userKey: propsValue.user });
    return googleAdminClient.flattenUser(user);
  },
});
