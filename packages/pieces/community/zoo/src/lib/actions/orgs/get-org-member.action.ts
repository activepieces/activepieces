import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getOrgMemberAction = createAction({
  name: 'get_org_member',
  displayName: 'Get Organization Member',
  description: 'Get details of a specific organization member',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single organization member by their user ID, including role and profile details. Use when you already have the user ID; to browse or discover members without an ID, use the list-org-members action instead. Read-only lookup with no side effects.', idempotent: true },
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
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });
    return response.body;
  },
});
