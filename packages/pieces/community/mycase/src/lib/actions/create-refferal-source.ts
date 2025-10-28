import { createAction, Property } from '@activepieces/pieces-framework';
import { myCaseAuth } from '../common/auth';
import { myCaseApiService } from '../common/requests';

export const createReferralSource = createAction({
  auth: myCaseAuth,
  name: 'createReferralSource',
  displayName: 'Create Referral Source',
  description: 'Creates a new referral source',
  props: {
    name: Property.ShortText({
      displayName: 'Referral Source Name',
      description: 'The name of the referral source',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const payload = {
      name: propsValue.name,
    };

    return await myCaseApiService.createReferralSource({
      accessToken: auth.access_token,
      payload,
    });
  },
});
