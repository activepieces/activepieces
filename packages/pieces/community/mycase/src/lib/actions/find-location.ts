import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const findLocationAction = createAction({
  auth: mycaseAuth,
  name: 'find_location',
  displayName: 'Find Location',
  description: 'Finds a location',
  props: {
    search: Property.ShortText({ displayName: 'Search Query', required: true }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    return await client.findLocation({ search: context.propsValue.search });
  },
});

