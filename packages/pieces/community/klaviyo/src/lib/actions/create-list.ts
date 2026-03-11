import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApiCall } from '../common/client';

export const createListAction = createAction({
  auth: klaviyoAuth,
  name: 'create_list',
  displayName: 'Create List',
  description: 'Create a new subscriber list in Klaviyo.',
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      description: 'Name for the new list',
      required: true,
    }),
  },
  async run(context) {
    return klaviyoApiCall({
      apiKey: context.auth,
      method: HttpMethod.POST,
      endpoint: '/lists',
      body: {
        data: {
          type: 'list',
          attributes: {
            name: context.propsValue.name,
          },
        },
      },
    });
  },
});
