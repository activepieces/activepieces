import { createAction, Property } from '@activepieces/pieces-framework';
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
      displayName: "List Name",
      description: "Create a new list.",
      required: true
    })
  },
  async run({auth,propsValue}) {
    
    const { name } = propsValue;
    const data = {
      data: {
        type: 'list',
        attributes: {
          name,
        },
      },
    };
    return await makeRequest(
      auth as string,
      HttpMethod.POST,
      `/lists`,
      data
    );

  },
});
