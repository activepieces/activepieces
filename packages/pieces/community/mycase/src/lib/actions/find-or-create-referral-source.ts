import { createAction, Property } from '@activepieces/pieces-framework';
import { myCaseAuth } from '../common/auth';
import { myCaseApiService } from '../common/requests';

export const findOrCreateReferralSource = createAction({
  auth: myCaseAuth,
  name: 'findOrCreateReferralSource',
  displayName: 'Find or Create Referral Source',
  description: 'Finds or creates a referral source.',
  props: {
    name: Property.ShortText({
      displayName: 'Referral Source Name',
      description: 'The name of the referral source',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const response = await myCaseApiService.fetchReferralSources({
      accessToken: context.auth.access_token,
      queryParams: {
        page_size: '1000',
      },
    });

    const existingReferralSource = response.find(
      (c: any) =>
        c.name && c.name.toLowerCase() === propsValue.name.toLowerCase()
    );

    if (existingReferralSource) return existingReferralSource;

    const payload = {
      name: propsValue.name,
    };

    return await myCaseApiService.createReferralSource({
      accessToken: auth.access_token,
      payload,
    });
  },
});
