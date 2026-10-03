import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';

export const deleteUserAlias = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'delete_user_alias',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete User Alias',
  description: 'Removes an email alias from a user.',
  audience: 'both',
  aiMetadata: {
    description:
      'Remove an email alias from a Google Workspace user; mail to it will bounce afterwards. A retry after success fails because the alias no longer exists.',
    idempotent: false,
  },
  props: {
    user: googleAdminProps.user({ required: true }),
    alias: Property.Dropdown<string, true, typeof googleWorkspaceAdminAuth>({
      auth: googleWorkspaceAdminAuth,
      displayName: 'Alias',
      required: true,
      refreshers: ['user'],
      options: async ({ auth, user }) => {
        if (!auth || typeof user !== 'string' || user === '') {
          return { disabled: true, options: [], placeholder: 'Please select a user first' };
        }
        const response = await googleAdminClient.request<{ aliases?: { alias: string }[] }>({
          auth,
          method: HttpMethod.GET,
          url: `${DIRECTORY_URL}/users/${encodeURIComponent(user)}/aliases`,
        });
        return {
          disabled: false,
          options: (response.aliases ?? []).map((a) => ({ label: a.alias, value: a.alias })),
        };
      },
    }),
  },
  async run({ auth, propsValue }) {
    await googleAdminClient.request({
      auth,
      method: HttpMethod.DELETE,
      url: `${DIRECTORY_URL}/users/${encodeURIComponent(propsValue.user)}/aliases/${encodeURIComponent(propsValue.alias)}`,
    });
    return { success: true, user: propsValue.user, alias: propsValue.alias };
  },
});
