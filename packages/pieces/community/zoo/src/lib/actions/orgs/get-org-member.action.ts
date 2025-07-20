import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getOrgMemberAction = createAction({
  name: 'get_org_member',
  displayName: 'Get Organization Member',
  description: 'Get details of a specific organization member',
  auth: zooAuth,
  // category: 'Organizations',
  props: {
    userId: Property.ShortText({
      displayName: 'User ID',
      required: true,
      description: 'ID of the member to retrieve',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.zoo.dev/org/members/${propsValue.userId}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });
    return response.body;
  },
});
