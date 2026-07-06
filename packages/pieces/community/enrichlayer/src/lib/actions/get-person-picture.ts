import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../auth';
import { enrichlayerApiCall } from '../common/client';
import { ENDPOINTS } from '../common/constants';

export const getPersonPicture = createAction({
  name: 'get_person_picture',
  auth: enrichlayerAuth,
  displayName: 'Get Person Profile Picture',
  description:
    'Get the profile picture URL of a person from cached profiles (0 credits)',
  audience: 'both',
  aiMetadata: {
    description:
      "Return the profile picture URL for a person from a known professional-network profile URL, served from cached profiles. Read-only, free, and safe to retry. Use only when you need the avatar image link; for full profile data use Get Person Profile.",
    idempotent: true,
  },
  props: {
    person_profile_url: Property.ShortText({
      displayName: 'Person Profile URL',
      description:
        'Professional network person URL (e.g., https://www.linkedin.com/in/williamhgates/)',
      required: true,
    }),
  },
  async run(context) {
    return await enrichlayerApiCall(
      context.auth.secret_text as string,
      ENDPOINTS.PERSON_PICTURE,
      {
        person_profile_url: context.propsValue.person_profile_url,
      },
    );
  },
});
