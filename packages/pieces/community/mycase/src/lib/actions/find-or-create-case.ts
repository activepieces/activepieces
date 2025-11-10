import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const findOrCreateCaseAction = createAction({
  auth: mycaseAuth,
  name: 'find_or_create_case',
  displayName: 'Find or Create Case',
  description: 'Finds or creates a case',
  props: {
    search: Property.ShortText({ displayName: 'Search Query', required: true }),
    name: Property.ShortText({ displayName: 'Name (if creating)', required: false }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    const existing = await client.findCase({ search: context.propsValue.search });
    if (existing && (existing as any).length > 0) return existing;
    return await client.createCase({ name: context.propsValue.name || context.propsValue.search });
  },
});

