import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const findOrCreateReferralSourceAction = createAction({
  auth: mycaseAuth,
  name: 'find_or_create_referral_source',
  displayName: 'Find or Create Referral Source',
  description: 'Finds or creates a referral source',
  props: {
    search: Property.ShortText({ displayName: 'Search Query', required: true }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    const existing = await client.findReferralSource({ search: context.propsValue.search }) as any;
    const existingItems = Array.isArray(existing) ? existing : (existing?.data || []);
    if (existingItems && existingItems.length > 0) {
      return existingItems[0];
    }
    return await client.createReferralSource({ name: context.propsValue.search });
  },
});

