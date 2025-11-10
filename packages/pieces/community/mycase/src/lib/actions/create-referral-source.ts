import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const createReferralSourceAction = createAction({
  auth: mycaseAuth,
  name: 'create_referral_source',
  displayName: 'Create Referral Source',
  description: 'Creates a new referral source',
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    return await client.createReferralSource({ name: context.propsValue.name });
  },
});

