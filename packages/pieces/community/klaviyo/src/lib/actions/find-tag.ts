import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../';
import { klaviyoApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const klaviyoFindTagByName = createAction({
  auth: klaviyoAuth,
  name: 'klaviyo_find_tag',
  displayName: 'Find Tag by Name',
  description: 'Locate a tag by name to manage tagging workflows.',
  props: {
    name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'The name of the tag to search for.',
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
      path: '/tags',
      queryParams: { filter },
    });

    return response.data.length > 0 ? response.data[0] : null;
  },
});
