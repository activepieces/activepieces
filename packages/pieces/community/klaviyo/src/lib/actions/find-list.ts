import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../';
import { klaviyoApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const klaviyoFindListByName = createAction({
  auth: klaviyoAuth,
  name: 'klaviyo_find_list',
  displayName: 'Find List by Name',
  description: 'Look up a list by name to get its ID.',
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      description: 'The name of the list to search for.',
      required: true,
    }),
  },
  async run(context) {
    const filter = `equals(name,"${context.propsValue.name}")`;

    const response = await klaviyoApiCall<{
      data: unknown[];
    }>({
      apiKey: context.auth,
      method: HttpMethod.GET,
      path: '/lists',
      queryParams: { filter },
    });

    return response.data.length > 0 ? response.data[0] : null;
  },
});
