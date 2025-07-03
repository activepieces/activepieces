import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const addOrgMemberAction = createAction({
  name: 'add_org_member',
  displayName: 'Add Organization Member',
  description: 'Add a new member to your organization',
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
        Authorization: `Bearer ${auth}`,
      },
      body: {
        email: propsValue.email,
        role: propsValue.role,
      },
    });
    return response.body;
  },
});
