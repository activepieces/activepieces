import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../../';
import { enrichlayerApiCall } from '../api';
import { ENDPOINTS } from '../common';

export const getCompanyPicture = createAction({
  name: 'get_company_picture',
  auth: enrichlayerAuth,
  displayName: 'Get Company Profile Picture',
  description:
    'Get the profile picture URL of a company from cached profiles (0 credits)',
  props: {
    company_profile_url: Property.ShortText({
      displayName: 'Company Profile URL',
      description:
        'Professional network company URL (e.g., https://www.linkedin.com/company/apple/)',
      required: true,
    }),
  },
  async run(context) {
    return await enrichlayerApiCall(
      context.auth as string,
      ENDPOINTS.COMPANY_PICTURE,
      {
        company_profile_url: context.propsValue.company_profile_url,
      },
    );
  },
});
