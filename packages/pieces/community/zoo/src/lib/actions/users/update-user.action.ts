import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const updateUserAction = createAction({
  name: 'update_user',
  displayName: 'Update User',
  description: 'Update your user information',
  auth: zooAuth,
  // category: 'Users',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
      description: 'Your new display name',
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
      description: 'Your new email address',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: 'https://api.zoo.dev/user',
      headers: {
        Authorization: `Bearer ${auth}`,
      },
      body: {
        ...(propsValue.name && { name: propsValue.name }),
        ...(propsValue.email && { email: propsValue.email }),
      },
    });
    return response.body;
  },
});
