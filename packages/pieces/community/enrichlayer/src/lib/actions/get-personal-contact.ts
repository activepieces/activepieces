import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../../';
import { enrichlayerApiCall } from '../api';
import { ENDPOINTS } from '../common';

export const getPersonalContact = createAction({
  name: 'get_personal_contact',
  auth: enrichlayerAuth,
  displayName: 'Look Up Personal Contact Numbers',
  description:
    'Find personal phone numbers from a social media profile (1 credit per number returned)',
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
    page_size: Property.ShortText({
      displayName: 'Page Size',
      description:
        'Maximum numbers returned (0 = no limit, default: 0)',
      required: false,
    }),
  },
  async run(context) {
    return await enrichlayerApiCall(
      context.auth as string,
      ENDPOINTS.PERSONAL_CONTACT,
      {
        profile_url: context.propsValue.profile_url,
        twitter_profile_url: context.propsValue.twitter_profile_url,
        facebook_profile_url: context.propsValue.facebook_profile_url,
        page_size: context.propsValue.page_size,
      },
    );
  },
});
