import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../';
import { klaviyoApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const klaviyoCreateList = createAction({
  auth: klaviyoAuth,
  name: 'klaviyo_create_list',
  displayName: 'Create List',
  description: 'Create a new subscriber list in Klaviyo.',
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      description: 'The name of the new list.',
      required: true,
    }),
  },
  async run(context) {
    return await klaviyoApiCall({
      apiKey: context.auth,
      method: HttpMethod.POST,
      path: '/lists',
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
