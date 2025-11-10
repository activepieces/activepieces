import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const createPracticeAreaAction = createAction({
  auth: mycaseAuth,
  name: 'create_practice_area',
  displayName: 'Create Practice Area',
  description: 'Creates a new practice area',
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    return await client.createPracticeArea({ name: context.propsValue.name });
  },
});

