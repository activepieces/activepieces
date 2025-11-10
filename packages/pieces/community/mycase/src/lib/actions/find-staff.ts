import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const findStaffAction = createAction({
  auth: mycaseAuth,
  name: 'find_staff',
  displayName: 'Find Staff',
  description: 'Finds a staff',
  props: {
    search: Property.ShortText({ displayName: 'Search Query', required: true }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    return await client.findStaff({ search: context.propsValue.search });
  },
});

