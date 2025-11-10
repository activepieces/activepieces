import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const findPracticeAreaAction = createAction({
  auth: mycaseAuth,
  name: 'find_practice_area',
  displayName: 'Find Practice Area',
  description: 'Finds a practice area',
  props: {
    search: Property.ShortText({ displayName: 'Search Query', required: true }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    return await client.findPracticeArea({ search: context.propsValue.search });
  },
});

