import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const getBrowserProfileAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_get_browser_profile',
  displayName: 'Get Browser Profile',
  description: 'Gets a browser profile by id.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one browser profile: its name, profileId, how many sessions used it and its stored data size.',
    idempotent: true,
  },
  props: {
    profileId: Property.ShortText({
      displayName: 'Profile ID',
      description:
        'The profileId, from List Browser Profiles or Create Browser Profile.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await scrapelessApi.getBrowserProfile({
      auth,
      profileId: propsValue.profileId,
    });
  },
});
