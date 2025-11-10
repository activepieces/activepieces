import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const findPersonContactAction = createAction({
  auth: mycaseAuth,
  name: 'find_person_contact',
  displayName: 'Find Person Contact',
  description: 'Finds a person',
  props: {
    search: Property.ShortText({ displayName: 'Search Query', required: true }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    return await client.findPersonContact({ search: context.propsValue.search });
  },
});

