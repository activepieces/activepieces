import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { klaviyoApiCall } from '../../common';

export const createList = createAction({
  name: 'create_list',
  auth: klaviyoAuth,
  displayName: 'Create List',
  description: 'Create a new subscriber list in Klaviyo.',
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      required: true,
    }),
  },
  async run(context) {
    const response = await klaviyoApiCall(
      HttpMethod.POST,
      'lists',
      context.auth.secret_text,
      {
        data: {
          type: 'list',
          attributes: {
            name: context.propsValue.name,
          },
        },
      }
    );
    return response.body;
  },
});
