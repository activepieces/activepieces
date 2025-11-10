import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const createLocationAction = createAction({
  auth: mycaseAuth,
  name: 'create_location',
  displayName: 'Create Location',
  description: 'Creates a new location',
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    return await client.createLocation({ name: context.propsValue.name });
  },
});

