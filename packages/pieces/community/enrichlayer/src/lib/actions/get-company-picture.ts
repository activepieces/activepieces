import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../auth';
import { enrichlayerApiCall } from '../common/client';
import { ENDPOINTS } from '../common/constants';

export const getCompanyPicture = createAction({
  name: 'get_company_picture',
  auth: enrichlayerAuth,
  displayName: 'Get Company Profile Picture',
  description:
    'Get the profile picture URL of a company from cached profiles (0 credits)',
  audience: 'both',
  aiMetadata: {
    description:
      "Retrieve a company's profile picture URL from its professional-network company page URL. Pick this when you only need the logo/avatar image link and not the full company record; it reads from cached profiles, costs no credits, and is read-only and idempotent.",
    idempotent: true,
  },
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
      context.auth.secret_text as string,
      ENDPOINTS.COMPANY_PICTURE,
      {
        company_profile_url: context.propsValue.company_profile_url,
      },
    );
  },
});
