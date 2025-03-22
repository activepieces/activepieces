import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createOrgAction = createAction({
  name: 'create_org',
  displayName: 'Create Organization',
  description: 'Create a new organization',
  auth: zooAuth,
  // category: 'Organizations',
  props: {
    name: Property.ShortText({
      displayName: 'Organization Name',
      required: true,
      description: 'The name for the new organization',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.zoo.dev/org',
      headers: {
        Authorization: `Bearer ${auth}`,
      },
      body: {
        name: propsValue.name,
      },
    });
    return response.body;
  },
});
