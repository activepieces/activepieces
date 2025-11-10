import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const findOrCreateLocationAction = createAction({
  auth: mycaseAuth,
  name: 'find_or_create_location',
  displayName: 'Find or Create Location',
  description: 'Finds or creates a location',
  props: {
    search: Property.ShortText({ displayName: 'Search Query', required: true }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    const existing = await client.findLocation({ search: context.propsValue.search });
    if (existing && (existing as any).length > 0) return existing;
    return await client.createLocation({ name: context.propsValue.search });
  },
});

