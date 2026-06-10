import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { tapfiliateAuth } from '../common/auth';
import { tapfiliateApiCall } from '../common/tapfiliate.client';

export const getAffiliateAction = createAction({
  auth: tapfiliateAuth,
  name: 'get_affiliate',
  displayName: 'Get Affiliate',
  description: 'Retrieves a Tapfiliate affiliate by ID.',
  props: {
    affiliateId: Property.ShortText({
      displayName: 'Affiliate ID',
      description: 'The unique Tapfiliate affiliate ID. Find it on the affiliate detail page in your Tapfiliate dashboard.',
      required: true,
    }),
  },
  async run(context) {
    return await tapfiliateApiCall({
      method: HttpMethod.GET,
      path: `/affiliates/${context.propsValue.affiliateId}/`,
      apiKey: context.auth.secret_text,
    });
  },
});
