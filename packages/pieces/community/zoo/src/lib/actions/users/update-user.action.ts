import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const updateUserAction = createAction({
  name: 'update_user',
  displayName: 'Update User',
  description: 'Update your user information',
  audience: 'both',
  aiMetadata: { description: 'Update the authenticated Zoo user\'s profile, setting a new display name and/or email. Only the provided fields are changed, and applying the same values again yields the same state (idempotent). Affects the current account only, not arbitrary users.', idempotent: true },
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
        Authorization: `Bearer ${auth.secret_text}`,
      },
      body: {
        ...(propsValue.name && { name: propsValue.name }),
        ...(propsValue.email && { email: propsValue.email }),
      },
    });
    return response.body;
  },
});
