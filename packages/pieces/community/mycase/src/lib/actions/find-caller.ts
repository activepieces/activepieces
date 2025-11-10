import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const findCallerAction = createAction({
  auth: mycaseAuth,
  name: 'find_caller',
  displayName: 'Find Caller',
  description: 'Finds a caller',
  props: {
    search: Property.ShortText({ displayName: 'Search Query', required: true }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    return await client.findCaller({ search: context.propsValue.search });
  },
});

