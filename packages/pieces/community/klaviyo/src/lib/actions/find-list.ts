import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../auth';
import { klaviyoApiCall } from '../common/common';

export const findList = createAction({
  auth: klaviyoAuth,
  name: 'find_list',
  displayName: 'Find List by Name',
  description: 'Searches for a Klaviyo list by name.',
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      description: 'The name of the list to search for.',
      required: true,
    }),
  },
  async run(context) {
    const { name } = context.propsValue;

    const result = await klaviyoApiCall<unknown>({
      method: HttpMethod.GET,
      apiKey: context.auth,
      path: '/lists',
      queryParams: {
        filter: `equals(name,"${name}")`,
      },
    });
    return result;
  },
});
