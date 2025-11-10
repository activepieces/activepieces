import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const findReferralSourceAction = createAction({
  auth: mycaseAuth,
  name: 'find_referral_source',
  displayName: 'Find Referral Source',
  description: 'Finds a referral source',
  props: {
    search: Property.ShortText({ displayName: 'Search Query', required: true }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    return await client.findReferralSource({ search: context.propsValue.search });
  },
});

