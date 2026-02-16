import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../index';
import { klaviyoApiRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const findTagAction = createAction({
  auth: klaviyoAuth,
  name: 'find-tag',
  displayName: 'Find Tag by Name',
  description: 'Find a tag by name to locate it for tagging workflows',
  props: {
    name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'Name of the tag to find',
      required: true,
    }),
  },
  async run(context) {
    const { name } = context.propsValue;

    const response = await klaviyoApiRequest(
      context.auth,
      HttpMethod.GET,
      '/tags/',
      undefined,
      {
        'filter': `equals(name,"${name}")`,
      }
    );

    return response;
  },
});
