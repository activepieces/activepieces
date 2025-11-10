import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const findPeopleGroupAction = createAction({
  auth: mycaseAuth,
  name: 'find_people_group',
  displayName: 'Find People Group',
  description: 'Finds a people group',
  props: {
    search: Property.ShortText({ displayName: 'Search Query', required: true }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    return await client.findPeopleGroup({ search: context.propsValue.search });
  },
});

