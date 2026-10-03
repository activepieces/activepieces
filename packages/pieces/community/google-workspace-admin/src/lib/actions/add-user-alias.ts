import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';

export const addUserAlias = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'add_user_alias',
  classification: 'WRITE',
  displayName: 'Add User Alias',
  description: 'Adds an alternate email address (alias) to a user.',
  audience: 'both',
  aiMetadata: {
    description:
      'Add an email alias to a Google Workspace user so mail sent to it reaches their inbox. The alias must use a verified domain and not be taken. A retry with the same alias fails with a conflict.',
    idempotent: false,
  },
  props: {
    user: googleAdminProps.user({ required: true }),
    alias: Property.ShortText({
      displayName: 'Alias',
      description: 'The alias email address, e.g. sales@yourcompany.com.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return googleAdminClient.request<{ id: string; primaryEmail: string; alias: string }>({
      auth,
      method: HttpMethod.POST,
      url: `${DIRECTORY_URL}/users/${encodeURIComponent(propsValue.user)}/aliases`,
      body: { alias: propsValue.alias },
    });
  },
});
