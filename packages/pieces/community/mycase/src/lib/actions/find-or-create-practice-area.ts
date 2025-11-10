import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const findOrCreatePracticeAreaAction = createAction({
  auth: mycaseAuth,
  name: 'find_or_create_practice_area',
  displayName: 'Find or Create Practice Area',
  description: 'Finds or creates a practice area',
  props: {
    search: Property.ShortText({ displayName: 'Search Query', required: true }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    const existing = await client.findPracticeArea({ search: context.propsValue.search }) as any;
    const existingItems = Array.isArray(existing) ? existing : (existing?.data || []);
    if (existingItems && existingItems.length > 0) {
      return existingItems[0];
    }
    return await client.createPracticeArea({ name: context.propsValue.search });
  },
});

