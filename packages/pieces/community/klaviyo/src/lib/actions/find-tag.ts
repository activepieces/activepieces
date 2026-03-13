import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../auth';
import { klaviyoApiCall } from '../common/common';

export const findTag = createAction({
  auth: klaviyoAuth,
  name: 'find_tag',
  displayName: 'Find Tag by Name',
  description: 'Searches for a Klaviyo tag by name.',
  props: {
    name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'The name of the tag to search for.',
      required: true,
    }),
  },
  async run(context) {
    const { name } = context.propsValue;

    const result = await klaviyoApiCall<{
      data: Array<{ id: string; type: string; attributes: { name: string } }>;
    }>({
      method: HttpMethod.GET,
      apiKey: context.auth,
      path: '/tags',
      queryParams: {
        filter: `equals(name,"${name}")`,
      },
    });
    return result;
  },
});
