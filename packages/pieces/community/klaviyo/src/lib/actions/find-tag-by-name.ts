import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApiCall } from '../common/client';

export const findTagByNameAction = createAction({
  auth: klaviyoAuth,
  name: 'find_tag_by_name',
  displayName: 'Find Tag by Name',
  description: 'Look up a Klaviyo tag by its name.',
  props: {
    name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'Name of the tag to search for',
      required: true,
    }),
  },
  async run(context) {
    return klaviyoApiCall({
      apiKey: context.auth,
      method: HttpMethod.GET,
      endpoint: '/tags',
      queryParams: {
        filter: `equals(name,"${context.propsValue.name}")`,
      },
    });
  },
});
