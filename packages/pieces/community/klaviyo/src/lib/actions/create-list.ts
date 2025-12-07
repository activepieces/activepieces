import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../auth';
import { klaviyoCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createList = createAction({
  auth: klaviyoAuth,
  name: 'create_list',
  displayName: 'Create List',
  description: 'Create a new subscriber list in Klaviyo',
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      description: 'The name of the new list',
      required: true,
    }),
  },
  async run(context) {
    const { name } = context.propsValue;

    const listData = {
      data: {
        type: 'list',
        attributes: {
          name,
        },
      },
    };

    const response = await klaviyoCommon.makeRequest(
      context.auth,
      HttpMethod.POST,
      '/lists',
      listData
    );

    return response.body;
  },
});
