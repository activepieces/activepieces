import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createList = createAction({
  auth: klaviyoAuth,
  name: 'createList',
  displayName: 'Create List',
  description: 'Create a new subscriber list.',
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      description: 'Name for the new list',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { name } = propsValue;

    if (!name || name.trim().length === 0) {
      throw new Error('List name cannot be empty');
    }

    const data = {
      data: {
        type: 'list',
        attributes: {
          name: name.trim(),
        },
      },
    };

    const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
    const response = await makeRequest(
      authProp.access_token,
      HttpMethod.POST,
      '/lists',
      data
    );

    return {
      success: true,
      message: `List "${name}" created successfully`,
      list: response.data,
    };
  },
});
