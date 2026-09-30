import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, DirectoryGroup, googleAdminClient } from '../common/client';

export const createGroup = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'create_group',
  classification: 'WRITE',
  displayName: 'Create Group',
  description: 'Creates a new group.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a Google Workspace group (mailing list / access group) with an email and name. Add people afterwards with Add Group Member. A retry with the same email fails with a conflict.',
    idempotent: false,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Group Email',
      description: 'e.g. marketing@yourcompany.com. Must use one of your verified domains.',
      required: true,
    }),
    name: Property.ShortText({ displayName: 'Name', required: true }),
    description: Property.LongText({ displayName: 'Description', required: false }),
  },
  async run({ auth, propsValue }) {
    return googleAdminClient.request<DirectoryGroup>({
      auth,
      method: HttpMethod.POST,
      url: `${DIRECTORY_URL}/groups`,
      body: googleAdminClient.compact({
        email: propsValue.email,
        name: propsValue.name,
        description: propsValue.description,
      }),
    });
  },
});
