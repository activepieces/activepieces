import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../index';
import { klaviyoApiRequest, KlaviyoList } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createListAction = createAction({
  auth: klaviyoAuth,
  name: 'create-list',
  displayName: 'Create List',
  description: 'Create a new subscriber list in Klaviyo',
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      description: 'Name of the list to create',
      required: true,
    }),
  },
  async run(context) {
    const { name } = context.propsValue;

    const list: KlaviyoList = {
      type: 'list',
      attributes: {
        name,
      },
    };

    const response = await klaviyoApiRequest(
      context.auth,
      HttpMethod.POST,
      '/lists/',
      { data: list }
    );

    return response;
  },
});
