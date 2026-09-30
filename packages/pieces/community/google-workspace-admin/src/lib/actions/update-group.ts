import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, DirectoryGroup, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';

export const updateGroup = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'update_group',
  classification: 'WRITE',
  displayName: 'Update Group',
  description: "Updates a group's name, email or description.",
  audience: 'both',
  aiMetadata: {
    description:
      'Update the name, email or description of an existing Google Workspace group; only filled fields change. Safe to retry.',
    idempotent: true,
  },
  props: {
    group: googleAdminProps.group({ required: true }),
    email: Property.ShortText({
      displayName: 'New Group Email',
      description: 'Renames the group address. The old address becomes an alias automatically.',
      required: false,
    }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
  },
  async run({ auth, propsValue }) {
    return googleAdminClient.request<DirectoryGroup>({
      auth,
      method: HttpMethod.PATCH,
      url: `${DIRECTORY_URL}/groups/${encodeURIComponent(propsValue.group)}`,
      body: googleAdminClient.compact({
        email: propsValue.email,
        name: propsValue.name,
        description: propsValue.description,
      }),
    });
  },
});
