import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../index';
import { klaviyoApiRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const findListAction = createAction({
  auth: klaviyoAuth,
  name: 'find-list',
  displayName: 'Find List by Name',
  description: 'Find a list by name to get its ID',
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      description: 'Name of the list to find',
      required: true,
    }),
  },
  async run(context) {
    const { name } = context.propsValue;

    const response = await klaviyoApiRequest(
      context.auth,
      HttpMethod.GET,
      '/lists/',
      undefined,
      {
        'filter': `equals(name,"${name}")`,
      }
    );

    return response;
  },
});
