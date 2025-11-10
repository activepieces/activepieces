import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const findOrCreatePersonAction = createAction({
  auth: mycaseAuth,
  name: 'find_or_create_person',
  displayName: 'Find or Create Person',
  description: 'Finds or creates a person',
  props: {
    search: Property.ShortText({ displayName: 'Search Query', required: true }),
    first_name: Property.ShortText({ displayName: 'First Name (if creating)', required: false }),
    last_name: Property.ShortText({ displayName: 'Last Name (if creating)', required: false }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    const existing = await client.findPersonContact({ search: context.propsValue.search });
    if (existing && (existing as any).length > 0) return existing;
    return await client.createPerson({ 
      first_name: context.propsValue.first_name || 'Unknown',
      last_name: context.propsValue.last_name || 'Unknown',
    });
  },
});

