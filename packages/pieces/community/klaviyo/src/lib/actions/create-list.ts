import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createList = createAction({
  auth: klaviyoAuth,
  name: 'createList',
  displayName: 'Create List',
  description: '',
  props: {
    name: Property.ShortText({
      displayName: "List Name",
      description: "Create a new list.",
      required: true
    })
  },
  async run(context) {
    const { api_key } = context.auth
    const { name } = context.propsValue;
    const data = {
      data: {
        type: 'list',
        attributes: {
          name,
        },
      },
    };
    return await makeRequest(
      api_key,
      HttpMethod.POST,
      `/lists`,
      data
    );

  },
});
