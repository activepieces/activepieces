import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aiprise } from '../common';
import { aipriseAuth } from '../../';

export const getBusinessProfileAction = createAction({
  auth: aipriseAuth,
  name: 'get_business_profile',
  displayName: 'Get Business Profile',
  description:
    'Fetches a business profile from AiPrise by its ID — including the stored company details, addresses, tags, linked verification sessions, and metadata.',
  props: {
    business_profile_id: Property.ShortText({
      displayName: 'Business Profile ID',
      description:
        'The ID of the business profile to retrieve. You can get this from the output of the **Create Business Profile** action, or from the `business_profile_id` field in any webhook payload from AiPrise.',
      required: true,
    }),
  },
  async run(context) {
    const { business_profile_id } = context.propsValue;
    return aiprise.makeRequest<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/verify/get_business_profile/${encodeURIComponent(business_profile_id)}`,
    });
  },
});
