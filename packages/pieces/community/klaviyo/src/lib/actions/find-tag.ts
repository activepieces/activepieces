import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../auth';
import { klaviyoCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const findTag = createAction({
  auth: klaviyoAuth,
  name: 'find_tag',
  displayName: 'Find Tag by Name',
  description: 'Search for a tag by its name',
  props: {
    name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'The name of the tag to find',
      required: true,
    }),
  },
  async run(context) {
    const { name } = context.propsValue;

    const filter = `equals(name,"${name}")`;

    const response = await klaviyoCommon.makeRequest(
      context.auth,
      HttpMethod.GET,
      `/tags?filter=${encodeURIComponent(filter)}`
    );

    const tags = response.body.data || [];

    return {
      found: tags.length > 0,
      count: tags.length,
      tags,
    };
  },
});
