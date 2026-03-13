import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../auth';
import { klaviyoApiCall } from '../common/common';

export const createList = createAction({
  auth: klaviyoAuth,
  name: 'create_list',
  displayName: 'Create List',
  description: 'Creates a new list in Klaviyo.',
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      description: 'The name for the new Klaviyo list.',
      required: true,
    }),
  },
  async run(context) {
    const { name } = context.propsValue;

    const result = await klaviyoApiCall<unknown>({
      method: HttpMethod.POST,
      apiKey: context.auth,
      path: '/lists',
      body: {
        data: {
          type: 'list',
          attributes: {
            name,
          },
        },
      },
    });
    return result;
  },
});
