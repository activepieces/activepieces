import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const findOrCreateCompanyAction = createAction({
  auth: mycaseAuth,
  name: 'find_or_create_company',
  displayName: 'Find or Create Company',
  description: 'Finds or creates a company',
  props: {
    search: Property.ShortText({ displayName: 'Search Query', required: true }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    const existing = await client.findCompanyContact({ search: context.propsValue.search }) as any;
    const existingItems = Array.isArray(existing) ? existing : (existing?.data || []);
    if (existingItems && existingItems.length > 0) {
      return existingItems[0];
    }
    return await client.createCompany({ name: context.propsValue.search });
  },
});

