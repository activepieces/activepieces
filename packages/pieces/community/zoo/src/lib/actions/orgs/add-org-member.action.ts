import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const addOrgMemberAction = createAction({
  name: 'add_org_member',
  displayName: 'Add Organization Member',
  description: 'Add a new member to your organization',
  audience: 'both',
  aiMetadata: { description: 'Add a user to the organization by email with a role of admin or member. Use to invite or grant access to a new member. Not idempotent: repeated calls for the same email may error or create duplicate invitations, so check existing membership first.', idempotent: false },
  auth: zooAuth,
  // category: 'Organizations',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
      description: 'Email address of the user to add',
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      required: true,
      options: {
        options: [
          { label: 'Admin', value: 'admin' },
          { label: 'Member', value: 'member' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.zoo.dev/org/members',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
      body: {
        email: propsValue.email,
        role: propsValue.role,
      },
    });
    return response.body;
  },
});
