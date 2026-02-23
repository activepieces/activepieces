import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../../';
import { enrichlayerApiCall } from '../api';
import { ENDPOINTS } from '../common';

export const getPersonPicture = createAction({
  name: 'get_person_picture',
  auth: enrichlayerAuth,
  displayName: 'Get Person Profile Picture',
  description:
    'Get the profile picture URL of a person from cached profiles (0 credits)',
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
      context.auth as string,
      ENDPOINTS.PERSON_PICTURE,
      {
        person_profile_url: context.propsValue.person_profile_url,
      },
    );
  },
});
