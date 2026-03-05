import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { klaviyoApiRequest } from '../common';

export const createList = createAction({
  auth: klaviyoAuth,
  name: 'create_list',
  displayName: 'Create List',
  description: 'Create a new subscriber list in Klaviyo.',
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      description: 'Name for the new list.',
      required: true,
    }),
  },
  async run(context) {
    return klaviyoApiRequest(
      context.auth as string,
      HttpMethod.POST,
      '/lists',
      {
        data: {
          type: 'list',
          attributes: {
            name: context.propsValue.name,
          },
        },
      },
    );
  },
});
