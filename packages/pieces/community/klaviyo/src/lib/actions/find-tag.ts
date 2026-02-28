import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { klaviyoApiCall } from '../common';

export const findTag = createAction({
  auth: klaviyoAuth,
  name: 'find_tag',
  displayName: 'Find Tag by Name',
  description: 'Locate a tag by name to manage tagging workflows.',
  props: {
    name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'The name of the tag to search for.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await klaviyoApiCall(auth as string, HttpMethod.GET, '/tags', undefined, {
      filter: `equals(name,"${propsValue.name}")`,
    });
  },
});
