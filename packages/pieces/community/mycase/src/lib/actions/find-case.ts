import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const findCaseAction = createAction({
  auth: mycaseAuth,
  name: 'find_case',
  displayName: 'Find Case',
  description: 'Finds a case',
  props: {
    search: Property.ShortText({ displayName: 'Search Query', required: true }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    return await client.findCase({ search: context.propsValue.search });
  },
});

