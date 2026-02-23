import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../../';
import { enrichlayerApiCall } from '../api';
import { ENDPOINTS } from '../common';

export const getPersonalEmail = createAction({
  name: 'get_personal_email',
  auth: enrichlayerAuth,
  displayName: 'Look Up Personal Email',
  description:
    'Find personal email addresses from a social media profile (1 credit per email returned)',
  props: {
    profile_url: Property.ShortText({
      displayName: 'Profile URL',
      description:
        'Professional network profile URL. Provide only one of Profile URL, Twitter URL, or Facebook URL.',
      required: false,
    }),
    twitter_profile_url: Property.ShortText({
      displayName: 'Twitter/X Profile URL',
      description:
        'Twitter/X profile URL (e.g., https://x.com/enrichlayer). Provide only one of Profile URL, Twitter URL, or Facebook URL.',
      required: false,
    }),
    facebook_profile_url: Property.ShortText({
      displayName: 'Facebook Profile URL',
      description:
        'Facebook profile URL (e.g., https://www.facebook.com/zuck). Provide only one of Profile URL, Twitter URL, or Facebook URL.',
      required: false,
    }),
    email_validation: Property.StaticDropdown({
      displayName: 'Email Validation',
      description: 'How to validate each email found',
      required: false,
      options: {
        options: [
          { label: 'None (default)', value: 'none' },
          { label: 'Fast (no extra credit)', value: 'fast' },
          {
            label: 'Precise (+1 credit per email)',
            value: 'precise',
          },
        ],
      },
    }),
    page_size: Property.ShortText({
      displayName: 'Page Size',
      description:
        'Maximum emails returned (0 = no limit, default: 0)',
      required: false,
    }),
  },
  async run(context) {
    return await enrichlayerApiCall(
      context.auth as string,
      ENDPOINTS.PERSONAL_EMAIL,
      {
        profile_url: context.propsValue.profile_url,
        twitter_profile_url: context.propsValue.twitter_profile_url,
        facebook_profile_url: context.propsValue.facebook_profile_url,
        email_validation: context.propsValue.email_validation,
        page_size: context.propsValue.page_size,
      },
    );
  },
});
