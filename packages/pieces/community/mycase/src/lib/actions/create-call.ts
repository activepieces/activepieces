import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const createCallAction = createAction({
  auth: mycaseAuth,
  name: 'create_call',
  displayName: 'Create Call',
  description: 'Creates a new call',
  props: {
    description: Property.ShortText({ displayName: 'Description', required: true }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    return await client.createCall({ description: context.propsValue.description });
  },
});

